var _socket = '';
var _socketURL = 'http://rynandemo.com:6025';
var _gateWay1 = 'G0158R1M001N002';
var _gateWay2 = 'G0158R1M002N002';
var _tablePump1, _tablePump2, _tableLog, _pagePump1 = 1, _pagePump2 = 1, _pageLog = 1;
var _dataPump1 = [], _dataPump2 = [];
var _pumpCode1, _pumpCode2, _pumpCodeLog;
var _statusGateWay1, _statusGateWay2;
var _dateNow = new Date()
var _yearNow = _dateNow.getFullYear()
var _monthNow = _dateNow.getMonth();
var _defaultOptsPump1 = {
    totalPages : 20,
    visiblePages : 5,
    onPageClick : function(event, page) {
        _pagePump1 = page;
    },
    first : '<<',
    prev : '<',
    next : '>',
    last : '>>'
}
var _defaultOptsPump2 = {
    totalPages : 20,
    visiblePages : 5,
    onPageClick : function(event, page) {
        _pagePump2 = page;
    },
    first : '<<',
    prev : '<',
    next : '>',
    last : '>>'
}

var _defaultOptsLog = {
    totalPages : 20,
    visiblePages : 5,
    onPageClick : function(event, page) {
        _pageLog = page;
    },
    first : '<<',
    prev : '<',
    next : '>',
    last : '>>'
}

var $paginationPump1 = $('#pump1Pagination');
var $paginationPump2 = $('#pump2Pagination');
var $paginationLog = $('#logPagination');

var _typeParse = {
    0: 'Thời gian',
    1: 'Lượng nước',
    2: 'Mực nước',
    3: 'Lượng nước/Thời gian'
}

var _listErrCode = {
    ERR_000523: 'Vui lòng truyền mã máy bơm',
    ERR_000522: 'Mã máy bơm không tồn tại, vui lòng thử lại',
    ERR_000906: 'Không được gửi yêu cầu bơm liên tiếp trong vòng time giây',
    ERR_000773: 'Máy bơm đang bận, vui lòng thử lại'
}

var _statusNotificationParse = {
    0: 'Yêu cầu bơm thành công, vui lòng chờ phản hồi',
    1: 'Yêu cầu bơm đến name đã thành công, name hiện tại đang bơm',
    2: 'name đã hoàn thành yêu cầu bơm, name hiện tại đã ngưng bơm',
    4: 'Hủy yêu cầu bơm đến name thành công, name hiện tại đã ngưng bơm'
}

var _statusGateWayParse = {
    0: 'Mới tạo',
    1: 'Đang hoạt động',
    2: 'Ngưng hoạt động',
    3: 'Mất kết nối'
}

if (!_socket) {
    _socket = io.connect(_socketURL);
}

setTimeout(function(){
    innitData();
}, 1000)

//Hàm innit dữ liệu
function innitData() {
    console.log("Connected to topic GateWay");
    _socket.on(_gateWay1, function (response) {
        console.log(response);
        
        if (response.ListPumpStatus) {// => kiểm tra trạng thái tất cả máy bơm gateway 1
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Thông báo',
                text: 'Đã nhận được thông tin đồng bộ',
                icon: 'info',
                timer: 1500,
                buttons: {
                    confirm: false
                },
            });
            var listPump = {};
            $.each(response.ListPumpStatus, function(index, data) {
                listPump[data.PumpCode] = response.Status;
            });
            $.each(_dataPump1, function(index, data) {
                if (listPump[data.PumpCode]) {
                    if (data._idCurrentRequest) {
                        data._idCurrentRequest.Status = 1;
                    }
                } else {
                    if (data._idCurrentRequest) {
                        _forkStopRequest(data._idCurrentRequest._id, data.PumpCode);
                    }
                    data._idCurrentRequest = null;
                }
            });
        } else {
            var key = '';
            var classIcon = 'info';
            var confirm = false;
            var timer = 1500;
            $.each(_dataPump1, function(index, data) {
                if (data.PumpCode == response.PumpCode) {
                    key = index;
                }
            });
            
            if (key === '' || (response.Status == 1 && response.PumpType != null)) {
                return false;
            }
            
            var msg = ''
            if (response.Status > 4) {
                confirm = 'Đồng ý';
                timer = false;
                msg = _dataPump1[key].DisplayName + ' ' + response.Description;
                _dataPump1[key]._idCurrentRequest = null;
            } else if (_statusNotificationParse[response.Status]) {
                classIcon = 'success';
                msg = _statusNotificationParse[response.Status].split('name').join(_dataPump1[key].DisplayName);
                if (!_dataPump1[key]._idCurrentRequest) {
                    _dataPump1[key]._idCurrentRequest = {
                        _id: response.IDRequest,
                        Status: response.Status
                    }
                } else {
                    _dataPump1[key]._idCurrentRequest.Status = response.Status;
                }
            }
            
            if (msg && response.Status != 0) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thông báo',
                    text: msg,
                    icon: classIcon,
                    timer: timer,
                    buttons: {
                        confirm: confirm
                    },
                });
            }
        }
        _drawPump1Data();
    });
    _socket.on(_gateWay2, function (response) {
        console.log(response);
        
        if (response.ListPumpStatus) {// => kiểm tra trạng thái tất cả máy bơm gateway 2
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Thông báo',
                text: 'Đã nhận được thông tin đồng bộ',
                icon: 'info',
                timer: 1500,
                buttons: {
                    confirm: false
                },
            });
            var listPump = {};
            $.each(response.ListPumpStatus, function(index, data) {
                listPump[data.PumpCode] = response.Status;
            });
            $.each(_dataPump2, function(index, data) {
                if (listPump[data.PumpCode]) {
                    if (data._idCurrentRequest) {
                        data._idCurrentRequest.Status = 1;
                    }
                } else {
                    if (data._idCurrentRequest) {
                        _forkStopRequest(data._idCurrentRequest._id, data.PumpCode);
                    }
                    data._idCurrentRequest = null;
                }
            });
        } else {
            var key = '';
            var classIcon = 'info';
            var confirm = false;
            var timer = 1500;
            $.each(_dataPump2, function(index, data) {
                if (data.PumpCode == response.PumpCode) {
                    key = index;
                }
            });
            
            if (key === '' || (response.Status == 1 && response.PumpType != null && response.TotalWater != null)) {
                return false;
            }
            
            var msg = ''
            if (response.Status > 4) {
                confirm = 'Đồng ý';
                timer = false;
                msg = _dataPump2[key].DisplayName + ' ' + response.Description;
                _dataPump2[key]._idCurrentRequest = null;
            } else if (_statusNotificationParse[response.Status]) {
                classIcon = 'success';
                msg = _statusNotificationParse[response.Status].split('name').join(_dataPump2[key].DisplayName);
                if (!_dataPump2[key]._idCurrentRequest) {
                    _dataPump2[key]._idCurrentRequest = {
                        _id: response.IDRequest,
                        Status: response.Status
                    }
                } else {
                    _dataPump2[key]._idCurrentRequest.Status = response.Status;
                }
            }
            
            if (msg && response.Status != 0) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thông báo',
                    text: msg,
                    icon: classIcon,
                    timer: timer,
                    buttons: {
                        confirm: confirm
                    },
                });
            }
        }
        _drawPump2Data();
    });
}

/**
 * 
 * @param idRequest
 * @param pumpCode
 * @returns
 */
function _forkStopRequest(idRequest, pumpCode) {
    var params = {
        PumpCode: pumpCode,
        IDRequest: idRequest
    }
    
    $.ajax({
        url: '/api/RequestMK/ForkStopRequest',
        dataType: 'json',
        type: 'POST',
        data: params,
        success: function (result) {}
    });
}

/**
 * 
 * @returns
 */
function _getStatusGateWay() {
    $.ajax({
        url: '/api/GateWayAWD/GetAll',
        dataType: 'json',
        type: 'GET',
        data: {
            Page: 1,
            PageLimit: 9999
        },
        async: false,
        success: function (result) {
            if (!result.success || !result.data || !result.data.length) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thông báo',
                    text: 'Không lấy được thông tin khu vực, vui lòng thử lại',
                    icon: 'warning',
                    buttons: {
                        cancel: 'Tải lại trang',
                        confirm: false
                    }
                }).then((confirm) => {
                    location.reload()
                });
            }
            
            $.each(result.data, function(index, data) {
                if (data.GateWayCode == _gateWay1) {
                    _statusGateWay1 = data.Status;
                }
                if (data.GateWayCode == _gateWay2) {
                    _statusGateWay2 = data.Status;
                }
            });
            
            $('#statusGateWay1').text('(' + _statusGateWayParse[_statusGateWay1] + ')');
            $('#statusGateWay2').text('(' + _statusGateWayParse[_statusGateWay2] + ')');
            
            if (_tablePump1) {
                _drawPump1Data();
            }
            if (_tablePump2) {
                _drawPump2Data()
            }
        }
    });
}
_getStatusGateWay();

setInterval(function(){ _getStatusGateWay(); }, 5000);


/**
 * Khởi tạo datatable
 */
function _initDatatable1() {
    _tablePump1 = $('#pump1Table')
            .dataTable({
                'searching' : false,
                'paging' : false,
                'info' : false,
                'ordering': false,
                'language': {
                    'emptyTable': 'Không tìm thấy dữ liệu'
                },
                'columns' : [{
                            data : '',
                            className: 'text-center',
                            render : function(data, type, row, meta) {
                                return (((_pagePump1 - 1)*15) + meta.row) +1;
                            }
                        },
                        {
                            data : 'DisplayName',
                        },
                        {
                            data : 'SpinSpeed',
                        },
                        {
                            data : 'PumpType',
                            render : function(data, type, row, meta) {
                                return _typeParse[data];
                            }
                        },
                        {
                            data : 'Status',
                            className: 'text-center',
                            render : function(data, type, row, meta) {
                                if (!row._idCurrentRequest || (row._idCurrentRequest.Status != 0 && row._idCurrentRequest.Status != 1)) {
                                    return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                            <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                            <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>';
                                }
                                switch (row._idCurrentRequest.Status) {
                                    case 0:
                                        return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                                <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>\
                                                <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>';
                                    case 1:
                                        return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>\
                                                <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                                <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>';
                                }
                                return '';
                            }
                        },
                        {
                            data : '',
                            className: 'text-center',
                            render : function(data, type, row, meta) {
                                if (_statusGateWay1 != 1) {
                                    return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                            <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm disabled" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;'
                                }
                                if (!row._idCurrentRequest || (row._idCurrentRequest.Status != 0 && row._idCurrentRequest.Status != 1)) {
                                    return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm startPump" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                            <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm disabled" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;'
                                }
                                switch (row._idCurrentRequest.Status) {
                                    case 0:
                                        return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Đang gửi yêu cầu"><i class="fa fa-spinner fa-spin"></i></button>&nbsp;\
                                                <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm cancelPump" title="Hủy yêu cầu"><i class="fa fa-stop"></i></button>&nbsp;';
                                    case 1:
                                        return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                                <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm stopPump" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;';
                                }
                                return '';
                            }
                        },
                        {
                            data : '',
                            className: 'text-center',
                            render : function(data, type, row, meta) {
                                return '<button data-name="'+ row.DisplayName +'"  data-id="' + row.PumpCode + '" class="btn-warning btn-sm logPump" title="Lịch sử thao tác"><i class="fa fa-history"></i></button>&nbsp;';
                            }
                        }]
                    });
    
    // Khởi tạo paging
    $paginationPump1.twbsPagination(_defaultOptsPump1);
}

function _initDatatable2() {
    _tablePump2 = $('#pump2Table')
    .dataTable({
        'searching' : false,
        'paging' : false,
        'info' : false,
        'ordering': false,
        'language': {
            'emptyTable': 'Không tìm thấy dữ liệu'
        },
        'columns' : [{
                    data : '',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        return (((_pagePump2 - 1)*15) + meta.row) +1;
                    }
                },
                {
                    data : 'DisplayName',
                },
                {
                    data : 'SpinSpeed',
                },
                {
                    data : 'PumpType',
                    render : function(data, type, row, meta) {
                        return _typeParse[data];
                    }
                },
                {
                    data : 'Status',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        if (!row._idCurrentRequest || (row._idCurrentRequest.Status != 0 && row._idCurrentRequest.Status != 1)) {
                            return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                    <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                    <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>';
                        }
                        switch (row._idCurrentRequest.Status) {
                            case 0:
                                return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                        <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>\
                                        <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>';
                            case 1:
                                return '<a style="color: green;" title="Đang bơm"><i class="fa fa-fw fa-circle" style="font-size: 20px;"></i></a>\
                                        <a style="color: orange;" title="Đang gửi yêu cầu"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>\
                                        <a style="color: red;" title="Đang rảnh"><i class="fa fa-fw fa-circle-o" style="font-size: 20px;"></i></a>';
                        }
                        return '';
                    }
                },
                {
                    data : '',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        if (_statusGateWay2 != 1) {
                            return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                    <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm disabled" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;'
                        }
                        if (!row._idCurrentRequest || (row._idCurrentRequest.Status != 0 && row._idCurrentRequest.Status != 1)) {
                            return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm startPump" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                    <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm disabled" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;'
                        }
                        switch (row._idCurrentRequest.Status) {
                            case 0:
                                return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Đang gửi yêu cầu"><i class="fa fa-spinner fa-spin"></i></button>&nbsp;\
                                        <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm cancelPump" title="Hủy yêu cầu"><i class="fa fa-stop"></i></button>&nbsp;';
                            case 1:
                                return '<button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-success btn-sm disabled" title="Bơm nước"><i class="fa fa-play"></i></button>&nbsp;\
                                        <button data-name="'+ row.DisplayName +'" data-id="' + row.PumpCode + '" class="btn-danger btn-sm stopPump" title="Ngưng bơm nước"><i class="fa fa-stop"></i></button>&nbsp;';
                                
                        }
                        return '';
                    }
                },
                {
                    data : '',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        return '<a data-name="'+ row.DisplayName +'"  data-id="' + row.PumpCode + '" class="btn-warning btn-sm logPump" title="Lịch sử thao tác"><i class="fa fa-history"></i></a>&nbsp;';
                    }
                }]
            });

    // Khởi tạo paging
    $paginationPump2.twbsPagination(_defaultOptsPump2);
}

/**
 * Khởi tạo table lịch sử thao tác
 * @returns
 */
function _initDatatableLog() {
    _tableLog = $('#logTable')
    .dataTable({
        'searching' : false,
        'paging' : false,
        'info' : false,
        'ordering': false,
        'language': {
            'emptyTable': 'Không tìm thấy dữ liệu'
        },
        'columns' : [{
                    data : '',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        return (((_pageLog - 1)*15) + meta.row) +1;
                    }
                },
                {
                    data : 'ValueRequest',
                    className: 'text-right',
                    render : function(data, type, row, meta) {
                        return Number(data) / 60;
                    }
                },
                {
                    data : 'RequestDate',
                    render : function(data, type, row, meta) {
                        return moment(new Date(data)).format('HH:mm DD/MM/YYYY');
                    }
                },
                {
                    data : 'Status',
                    render : function(data, type, row, meta) {
                        switch(data) {
                            case 0:
                                return 'Đang gửi yêu cầu bơm';
                            case 1:
                                return 'Đang thực hiện';
                            case 2:
                                return 'Hoàn thành';
                            case 3:
                                return 'Đang hủy';
                            case 4:
                                return 'Đã hủy';
                            default:
                                return 'Mới tạo';
                        }
                    }
                },
                {
                    data : 'ValueTimeReality',
                    render : function(data, type, row, meta) {
                        if (data > 60) {
                            return (data/60).toFixed(2).toString() + ' phút';
                        }
                        return data + ' giây';
                    }
                },
                {
                    data : 'StaffCode',
                    render : function(data, type, row, meta) {
                        if (!data) {
                            return 'admin';
                        }
                        return data;
                    }
                },
                {
                    data : '',
                    className: 'text-center',
                    render : function(data, type, row, meta) {
                        if (row.Status == 1) {
                            return '<a data-id="' + row._id + '" data-code="' + row.PumpCode + '" class="btn-danger btn-sm syncRequest" title="Hủy yêu cầu"><i class="fa fa-trash"></i></a>&nbsp;';
                        }
                        return '';
                    }
                }]
            });

    // Khởi tạo paging
    $paginationLog.twbsPagination(_defaultOptsLog);
}

/**
 * Gọi ajax search
 */
_getPump1Data = function(page) {
    var params = 'Page=' + page;
    params += '&PageLimit=15&GateWayCode=' + _gateWay1;
    $.ajax({
        url: '/api/PumpMK/GetByGateWayCode',
        dataType: 'json',
        type: 'GET',
        data: params,
        success: function (result) {
            var data = [];
            if (result.data && result.data.length) {
                data = result.data;
            }
            _dataPump1 = data;
            
            _drawPump1Data()
            $paginationPump1.twbsPagination('destroy');
            $paginationPump1.twbsPagination($.extend({}, _defaultOptsPump1, {
                startPage: page,
                totalPages: result.TotalPage ? result.TotalPage : 1
            }));

            var record = (data.length? data.length:0);
            $('#totalRecordPump1').text(record + ' kết quả');
            var from = ((_pagePump1 - 1) * 15) + (data.length? 1:0);
            var to = ((_pagePump1 - 1) * 15) + data.length;
            var total = (data.length? data.length:0);
            $('#resultInfoPump1').text('Hiển thị ' + from + ' đến ' + to + ' của ' + total + ' kết quả');
        }
    });
}

function _drawPump1Data() {
    _tablePump1.DataTable().clear();
    _tablePump1.DataTable().rows.add(_dataPump1);
    _tablePump1.DataTable().draw();
}

/**
 * Gọi ajax search
 */
_getPump2Data = function(page) {
    var params = 'Page=' + page;
    params += '&PageLimit=15&GateWayCode=' + _gateWay2;
    $.ajax({
        url: '/api/PumpMK/GetByGateWayCode',
        dataType: 'json',
        type: 'GET',
        data: params,
        success: function (result) {
            var data = [];
            if (result.data && result.data.length) {
                data = result.data;
            }
            _dataPump2 = data;
            _drawPump2Data()
            $paginationPump2.twbsPagination('destroy');
            $paginationPump2.twbsPagination($.extend({}, _defaultOptsPump2, {
                startPage: page,
                totalPages: result.TotalPage ? result.TotalPage : 1
            }));

            var record = (data.length? data.length:0);
            $('#totalRecordPump2').text(record + ' kết quả');
            var from = ((_pagePump2 - 1) * 15) + (data.length? 1:0);
            var to = ((_pagePump2 - 1) * 15) + data.length;
            var total = (data.length? data.length:0);
            $('#resultInfoPump2').text('Hiển thị ' + from + ' đến ' + to + ' của ' + total + ' kết quả');
        }
    });
}

function _drawPump2Data() {
    if (_tablePump2) {
        _tablePump2.DataTable().clear();
        _tablePump2.DataTable().rows.add(_dataPump2);
        _tablePump2.DataTable().draw();
    }
}

/**
 * Lấy dữ liệu lịch sử thao tác
 * @param page
 * @returns
 */
function _getLogPump(page) {
    if (!$('#DateFrom').val()) {
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Lỗi',
            text: 'Vui lòng nhập ngày bắt đầu',
            icon: 'warning',
            buttons: {
                confirm: 'Đồng ý'
            }
        });
    }
    
    if (!$('#DateTo').val()) {
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Lỗi',
            text: 'Vui lòng nhập ngày kết thúc',
            icon: 'warning',
            buttons: {
                confirm: 'Đồng ý'
            }
        });
    }
    
    var params = 'Page=' + page;
    params += '&PageLimit=15&PumpCode=' + _pumpCodeLog;
    params += '&FromDate=' + moment($('#DateFrom').val(), 'DD/MM/YYYY').format('YYYY/MM/DD');
    params += '&ToDate=' + moment($('#DateTo').val(), 'DD/MM/YYYY').format('YYYY/MM/DD');
    $.ajax({
        url: '/api/RequestMK/GetAll',
        dataType: 'json',
        type: 'GET',
        data: params,
        success: function (result) {
            var data = [];
            if (result.data && result.data.length) {
                data = result.data;
            }
            
            _tableLog.DataTable().clear();
            _tableLog.DataTable().rows.add(data);
            _tableLog.DataTable().draw();
            
            $paginationLog.twbsPagination('destroy');
            $paginationLog.twbsPagination($.extend({}, _defaultOptsLog, {
                startPage: page,
                totalPages: result.TotalPage ? result.TotalPage : 1
            }));

            var from = ((_pageLog - 1) * 15) + (data.length? 1:0);
            var to = ((_pageLog - 1) * 15) + data.length;
            var total = result.CountData? result.CountData: 0;
            $('#resultInfoLog').text('Hiển thị ' + from + ' đến ' + to + ' của ' + total + ' kết quả');
        }
    });
}

/**
 * Khởi động máy bơm
 * @returns
 */
function _startPump() {
    var params = {
        StaffCode: 'admin',
        RequestDate: new Date(),
        ValueRequest: Number($('#ValueRequest').val()) * 60
    };
    var delayTime = 30;
    
    if (_pumpCode1) {
        params.PumpCode = _pumpCode1;
        $.each(_dataPump1, function(index, data) {
            if (data.PumpCode == _pumpCode1) {
                params.PumpType = data.PumpType;
                delayTime = data.DelayTime;
            }
        });
    } else {
        params.PumpCode = _pumpCode2;
        $.each(_dataPump2, function(index, data) {
            if (data.PumpCode == _pumpCode2) {
                params.PumpType = data.PumpType;
                delayTime = data.DelayTime;
            }
        });
    }
        
    $.ajax({
        url: '/api/RequestMK/InsByStaff',
        dataType: 'json',
        type: 'POST',
        data: {
            Data: JSON.stringify(params)
        },
        success: function (result) {
            if (result.success) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thành công',
                    text: 'Yêu cầu bơm thành công, vui lòng chờ phản hồi',
                    icon: 'success',
                    timer: 1500,
                    buttons: false,
                });
                $('#modalStartPump').modal('hide');
                return;
            }
            $('#modalStartPump').modal('hide');
            if (result.errcode) {
                var msg = _listErrCode[result.errcode];
                if (result.errcode == 'ERR_000906') {
                    msg = msg.replace('time', delayTime);
                }
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Lỗi',
                    text: msg,
                    icon: 'error',
                    buttons: {
                        confirm: 'Đồng ý'
                    }
                });
                return;
            }
            
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Khởi động máy bơm thất bại vui lòng thử lại',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
        }
    });
}

/**
 * Lấy params hủy/dừng yêu cầu
 * @param idElm
 * @param id
 * @returns
 */
function _getParamsStop(idElm, id, statusBefore) {
    var params = {
        PumpCode: id
    }
    var pump;
    if (idElm == 'pump1Table') {
        $.each(_dataPump1, function(index, data) {
            if (data.PumpCode == id) {
                pump = data;
            }
        });
    } else {
        $.each(_dataPump2, function(index, data) {
            if (data.PumpCode == id) {
                pump = data;
            }
        });
    }
    
    if (pump && pump._idCurrentRequest && pump._idCurrentRequest.Status == statusBefore) {
        params.IDRequest = pump._idCurrentRequest._id;
        return params;
    }
    
    return null;
    
    
}

/**
 * Dừng bơm
 * @param idElm
 * @param id
 * @returns
 */
function _stopPump(idElm, id) {
    var params = _getParamsStop(idElm, id, 1);
    if (!params) {
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Lỗi',
            text: 'Yêu cầu dừng bơm thất bại, vui lòng thử lại',
            icon: 'error',
            timer: 1500,
            buttons: false,
        });
        return;
    }
    $.ajax({
        url: '/api/RequestMK/CancelRequest',
        dataType: 'json',
        type: 'POST',
        data: params,
        success: function (result) {
            if (result.success) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thành công',
                    text: 'Yêu cầu dừng bơm thành công, vui lòng chờ phản hồi',
                    icon: 'success',
                    timer: 1500,
                    buttons: false,
                });
                return;
            }
            if (result.errcode) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Lỗi',
                    text: _listErrCode[result.errcode],
                    icon: 'error',
                    buttons: {
                        confirm: 'Đồng ý'
                    }
                });
                return;
            }
            
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Yêu cầu dừng bơm thất bại, vui lòng thử lại',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
        }
    });
}

/**
 * Hủy yêu cầu bơm
 * @param idElm
 * @param id
 * @returns
 */
function _cancelPump(idElm, id) {
    var params = _getParamsStop(idElm, id, 0);
    if (!params) {
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Lỗi',
            text: 'Hủy yêu cầu bơm thất bại, vui lòng thử lại',
            icon: 'error',
            timer: 1500,
            buttons: false,
        });
        return;
    }
    $.ajax({
        url: '/api/RequestMK/ForkStopRequest',
        dataType: 'json',
        type: 'POST',
        data: params,
        success: function (result) {
            if (result.success) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thành công',
                    text: 'Hủy yêu cầu bơm thành công',
                    icon: 'success',
                    timer: 1500,
                    buttons: false,
                });
                setTimeout(function() {
                    if (idElm = 'pump1Table') {
                        $("#BtnCheck").click();
                    } else {
                        $("#BtnCheck2").click();
                    }
                }, 1000);
                return;
            }
            if (result.errcode) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Lỗi',
                    text: _listErrCode[result.errcode],
                    icon: 'error',
                    buttons: {
                        confirm: 'Đồng ý'
                    }
                });
                return;
            }
            
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Hủy yêu cầu bơm thất bại, vui lòng thử lại',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
        }
    });
}

function _syncRequest(id, code) {
    $.ajax({
        url: '/api/RequestMK/UpdateRequestFromWeb',
        dataType: 'json',
        type: 'POST',
        data: {
            IDRequest: id,
            PumpCode: code
        },
        success: function (result) {
            if (result.success) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Thành công',
                    text: 'Hủy yêu cầu thành công',
                    icon: 'success',
                    timer: 1500,
                    buttons: false,
                });
                _getLogPump(1);
                return;
            }
            if (result.errcode) {
                swal({
                    closeOnEsc: false,
                    closeOnClickOutside: false,
                    title: 'Lỗi',
                    text: _listErrCode[result.errcode],
                    icon: 'error',
                    buttons: {
                        confirm: 'Đồng ý'
                    }
                });
                return;
            }
            
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Hủy yêu cầu thất bại, vui lòng thử lại',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
        }
    });
}

$(function() {
    $("#BtnCheck").on("click", function(){
        $.ajax({
            url: '/api/PumpMK/GetDevice',
            dataType: 'json',
            type: 'GET',
            data: {
                GateWayCode: _gateWay1
            },
            async: false,
            success: function (result) {
                if (!result.success || !result.data || !result.data.length) {
                    swal({
                        closeOnEsc: false,
                        closeOnClickOutside: false,
                        title: 'Thành công',
                        text: 'Đồng bộ trạng thái thiết bị thành công, vui lòng đợi trong giây lát',
                        icon: 'success',
                        timer: 1500,
                        buttons: false,
                    });
                } else{
                    sweetAlert("Thất bại", "Xảy ra lỗi, vui lòng thử lại sau", "warning")
                }
            }
        });
    })

    $("#BtnCheck2").on("click", function(){
        $.ajax({
            url: '/api/PumpMK/GetDevice',
            dataType: 'json',
            type: 'GET',
            data: {
                GateWayCode: _gateWay2
            },
            async: false,
            success: function (result) {
                if (!result.success || !result.data || !result.data.length) {
                    swal({
                        closeOnEsc: false,
                        closeOnClickOutside: false,
                        title: 'Thành công',
                        text: 'Đồng bộ trạng thái thiết bị thành công, vui lòng đợi trong giây lát',
                        icon: 'success',
                        timer: 1500,
                        buttons: false,
                    });
                } else{
                    sweetAlert("Thất bại", "Xảy ra lỗi, vui lòng thử lại sau", "warning")
                }
            }
        });
    })

    _initDatatable1();
    _getPump1Data(1);
    
    $('.datepicker').datepicker({
        language: 'vi',
        autoclose: true,
        todayBtn: true,
        todayHighlight: true
    });
    
    $('#DateFrom').datepicker('setDate', new Date(_yearNow, _monthNow, 1));
    $('#DateTo').datepicker('setDate', _dateNow);
    
    $('#DateFrom').datepicker('setEndDate', moment($('#DateTo').val(), 'DD/MM/YYYY').toDate());
    $('#DateTo').datepicker().on('changeDate', function(e) {
        $('#DateFrom').datepicker('setEndDate', moment($('#DateTo').val(), 'DD/MM/YYYY').toDate());
    });
    
    $('#DateTo').datepicker('setStartDate', moment($('#DateFrom').val(), 'DD/MM/YYYY').toDate());
    $('#DateFrom').datepicker().on('changeDate', function(e) {
        $('#DateTo').datepicker('setStartDate', moment($('#DateFrom').val(), 'DD/MM/YYYY').toDate());
    });
    
    $('#pump1_paginate').on('click', function (e) {
        if ($(e.target).hasClass('page-link')) {
            _getPump1Data(_pagePump1);
        }
    });
    
    $('#pump2_paginate').on('click', function (e) {
        if ($(e.target).hasClass('page-link')) {
            _getPump2Data(_pagePump2);
        }
    });
    
    $('#log_paginate').on('click', function (e) {
        if ($(e.target).hasClass('page-link')) {
            _getLogPump(_pageLog);
        }
    });
    
    $('.nav-tabs a').on('shown.bs.tab', function(event){
        var id = event.target.id;
        if (id == 'Tabpump1') {
            _getPump1Data(1);
        } else {
            if (!_tablePump2) {
                _initDatatable2();
            }
            _getPump2Data(1);
        }
    });
    
    $('#pump1Table, #pump2Table').on('click', '.startPump', function(){
        if ( $(this).hasClass('disabled')) {
            return false;
        }
        var idElm = $(this).closest('table').attr('id');
        if (idElm == 'pump1Table') {
            _pumpCode1 = $(this).data('id');
        } else {
            _pumpCode2 = $(this).data('id');
        }
        if ($(this).data('id') == '94009' || $(this).data('id') == '94010') {
            $('#pumpNameModel').text($(this).data('name'));
            $('#ValueRequest').val('');
            $('#modalStartPump').modal('show');
        } else {
            $('#ValueRequest').val(1);
            _startPump();
        }
    });
    
    $('#modalStartPump').on('hidden.bs.modal', function () {
        _pumpCode1 = undefined;
        _pumpCode2 = undefined;
    })
    
    /**
     * Click bơm nước
     */
    $('#startPump').on('click', function() {
        if ($('#ValueRequest').val() == null || $('#ValueRequest').val() == '') {
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Vui lòng nhập thời gian bơm',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
            return;
        }
        var regex = /^(0|[1-9][0-9]*)$/;
        if (!regex.test($('#ValueRequest').val()) || $('#ValueRequest').val() <= 0) {
            swal({
                closeOnEsc: false,
                closeOnClickOutside: false,
                title: 'Lỗi',
                text: 'Vui lòng nhập thời gian bơm là số lớn hơn 0',
                icon: 'error',
                buttons: {
                    confirm: 'Đồng ý'
                }
            });
            return;
        }
        
        _startPump();
    });
    
    $('#pump1Table, #pump2Table').on('click', '.stopPump', function(){
        if ( $(this).hasClass('disabled')) {
            return false;
        }
        var idElm = $(this).closest('table').attr('id');
        var id = $(this).data('id');
        var name = $(this).data('name');
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Cảnh báo',
            text: 'Bạn có chắc muốn dừng bơm từ ' + name + '?',
            icon: 'warning',
            buttons: {
                cancel: 'Quay lại',
                confirm: 'Đồng ý'
            }
        }).then((confirm) => {
            if (confirm) {
                _stopPump(idElm, id);
            }
        });
    });
    
    $('#pump1Table, #pump2Table').on('click', '.cancelPump', function(){
        if ( $(this).hasClass('disabled')) {
            return false;
        }
        var idElm = $(this).closest('table').attr('id');
        var id = $(this).data('id');
        var name = $(this).data('name');
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Cảnh báo',
            text: 'Bạn có chắc muốn hủy yêu cầu bơm từ ' + name + '?',
            icon: 'warning',
            buttons: {
                cancel: 'Quay lại',
                confirm: 'Đồng ý'
            }
        }).then((confirm) => {
            if (confirm) {
                _cancelPump(idElm, id);
            }
        });
    });
    
    $('#pump1Table, #pump2Table').on('click', '.logPump', function(){
        if ( $(this).hasClass('disabled')) {
            return false;
        }
        _pumpCodeLog = $(this).data('id');
        var name = $(this).data('name');
        
        $('#pumpNameLogModel').text(name);
        $('#modalLogPump').modal('show');
    });
    
    $('#modalLogPump').on('shown.bs.modal', function() {
        if (!_tableLog) {
            _initDatatableLog();
        }
        $('#DateFrom').datepicker('setDate', new Date(_yearNow, _monthNow, 1));
        $('#DateTo').datepicker('setDate', _dateNow);
        _getLogPump(1);
    });
    
    $('#viewLogPump').on('click', function() {
        _getLogPump(1);
    });
    
    $('#logTable').on('click', '.syncRequest', function() {
        var id = $(this).data('id');
        var code = $(this).data('code');
        swal({
            closeOnEsc: false,
            closeOnClickOutside: false,
            title: 'Cảnh báo',
            text: 'Bạn có chắc muốn hủy yêu cầu bơm này?',
            icon: 'warning',
            buttons: {
                cancel: 'Quay lại',
                confirm: 'Đồng ý'
            }
        }).then((confirm) => {
            if (confirm) {
                _syncRequest(id, code);
            }
        });
    });
})