const express = require('express');
const bodyParser = require('body-parser');
var morgan = require('morgan');
var port = process.env.PORT || 3000
var mqtt = require('mqtt')
var schedule = require('node-schedule');
var toBuffer = require('typedarray-to-buffer')
var ieee754 = require('ieee754')
var reverse_buffer = require("buffer-reverse")
const Node = require('./app/models/node.model.js');
const Device = require('./app/models/device.model.js');
const request = require('supertest');

var deviceType = {
    SWM_DEVICE_TYPE: 0x01,
    EMETER_DEVICE_TYPE: 0x05
};
var EMETER_SERIAL_NUMBER_LEN = 15; // Length of Serial number
// Parameter codes
var parameterCode = {
    PARAM_PIN_PERCENT: 0x0001, // Parameter: PIN Percent (0x02 Unsigned Chart)
    PARAM_CHARGE_STATUS: 0x0002, // Parameter: Charge status (0x03 Chart)
    PARAM_ADAPTER_DETECT: 0x0003, // Parameter: Adapter detect (0x03 Chart)
    PARAM_CONSUMPTION: 0x0009, // Parameter: Energy Consumption (0x09 float)
    PARAM_RMS_CURRENT: 0x000A, // Parameter: RMS Current (0x09 float)
    PARAM_ACTIVE_POWER: 0x000B, // Parameter: Active Power (0x09 float)
    PARAM_NUMBER_USED: 0x000C, // Parameter: Number energy used (0x09 float)
    PARAM_REACTIVE_POWER: 0x0011, // Parameter: Reactive Power (0x06 int)
    PARAM_RMS_VOLTAGE: 0x0012, // Parameter: Reactive Power (0x09 float)
    PARAM_MAX_DEMAND: 0x0013, // Parameter: Max Demand (0x06 int)
    PARAM_PHASE_ANGLE: 0x0014 // Parameter: Phase angle (0x04 short int)
};
// Format type codes
var formatType = {
    FORMAT_SIGNED_CHAR: 0x01, // Format: Signed Char (1 byte)
    FORMAT_UNSIGNED_CHAR: 0x02, // Format: Unsigned Char (1 byte)
    FORMAT_CHAR: 0x03, // Format: Char (1 byte)
    FORMAT_SHORT_INT: 0x04, // Format: Short Int (2 byte)
    FORMAT_USIG_SHORT_INT: 0x05, // Format: Unsigned Short Int (2 byte)
    FORMAT_INT: 0x06, // Format: Int (4 byte)
    FORMAT_UNSIGNED_INT: 0x07, // Format: Unsigned Int (4 byte)
    FORMAT_SIGNED_INT: 0x08, // Format: Signed Int (4 byte)
    FORMAT_FLOAT_4BYTE: 0x09, // Format: Float (4 byte)
    FORMAT_DOUBLE: 0x0A // Format: Double (8 byte)
};
// Data length
var dataLength = {
    DATA_LEN_SIGNED_CHAR: 0x0001, // Data len: Signed Char (1 byte)
    DATA_LEN_UNSIGNED_CHAR: 0x0001, // Data len: Unsigned Char (1 byte)
    DATA_LEN_CHAR: 0x0001, // Data len: Char (1 byte)
    DATA_LEN_SHORT_INT: 0x0002, // Data len: Short Int (2 byte)
    DATA_LEN_USIG_SHORT_INT: 0x0002, // Data len: Unsigned Short Int (2 byte)
    DATA_LEN_INT: 0x0004, // Data len: Int (4 byte)
    DATA_LEN_UNSIGNED_INT: 0x0004, // Data len: Unsigned Int (4 byte)
    DATA_LEN_SIGNED_INT: 0x0004, // Data len: Signed Int (4 byte)
    DATA_LEN_FLOAT_4BYTE: 0x0004, // Data len: Float (4 byte)
    DATA_LEN_DOUBLE: 0x0008 // Data len: Double (8 byte)
};

// create express app
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// Fix loi Access-Control-Allow-Origin
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
})


// parse application/json
app.use(bodyParser.json())
app.use(morgan('dev')); // log every request to the console
// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
// MongoDB connection options
const connectOptions = {
    //useMongoClient: true,
    autoReconnect: true
};
// Create MongoDB connection
var db = mongoose.connection;
// Connecting to MongoDB 
db.on('connecting', function() {
    console.log('connecting to MongoDB...');
});
// Error issues during connect to MongoDB 
db.on('error', function(error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
// Connected to MongoDB 
db.on('connected', function() {
    console.log('MongoDB connected!');
});

// Reconnecting to MongoDB 
db.on('reconnected', function() {
    console.log('MongoDB reconnected!');
});
// Disconnected to MongoDB 
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    mongoose.connect(dbConfig.url, connectOptions);
});
// Connecting to MongoDB via URI with options
mongoose.connect(dbConfig.url, connectOptions)
    .then(() => {
        console.log("Successfully connected to the database");
    }).catch(err => {
        console.log('Could not connect to the database. Exiting now...');
        process.exit();
    });

// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes." });
});

require('./app/routes/note.routes.js')(app);
require('./app/routes/sensor.routes.js')(app);
require('./app/routes/node.routes.js')(app);
require('./app/routes/device.routes.js')(app);
require('./app/routes/nodecacheday.routes.js')(app);

// listen for requests
//----------------------------------------------------------------------------------
// MQTT Service
//----------------------------------------------------------------------------------
// MQTT Client config
var mqtt_client = mqtt.connect({
    host: 'smarthome.myftp.org',
    port: 1883,
    keepalive: 60000,
    username: 'trieu.le',
    password: 'trieu.le',
    protocolId: 'MQIsdp',
    protocolVersion: 3
});
// MQTT Connect to Broker
mqtt_client.on('connect', function() {
    console.log('Connected to Broker');
    // Subcribe all topic
    //mqtt_client.subscribe('#');
    mqtt_client.subscribe('#');
});
// MQTT Close Handler
mqtt_client.on('close', function() {
    // Reconnect to Broker
    mqtt_client = mqtt.connect({
        host: 'smarthome.myftp.org',
        port: 1883,
        keepalive: 60000,
        username: 'trieu.le',
        password: 'trieu.le',
        protocolId: 'MQIsdp',
        protocolVersion: 3
    });
});

var node_serial_number = "";
var node_send_date;
// MQTT Incomming message parser
mqtt_client.on('message', function(topic, message) {
    // message is Buffer
    // console.log(topic.toString()); // Print topic string
    
    const [payload_direct, device_type, device_serial] = topic.toString().split('/');
    console.log('Message from device: ', device_serial); // Apt 4
    // console.log(message.toString('hex')); // Print buffer as hex string
    try {
        if (device_serial.length == 15)
        {
            Device.find({
                SerialNumber: device_serial
            }, function (err, docs) {
                if (docs.length) 
                {
                    console.log("Docs: ", docs);
                   console.log('Found device: ', device_serial + ' ,Device name: ' + docs[0].DeviceName);
                   let payload = JSON.parse(message);
                   console.log("JSON Payload: ", payload);
                   let node_data = new Node;
                   node_data.payload = payload;
                   node_data.sensor_id = device_serial;
                   node_data.sensor_type = "DS18B20";
                   node_data.sensor_time = new Date();
                   node_data.save(function (err) {
                         if (err) {
                             console.log(err);
                         } 
                         else {
                            console.log('Save node data successfully !');
                         }
                     });
                } 
                else
                {
                    
                    console.log('Device Not Found');
                }
            });
        }
    } catch (err) {
        console.error(err)
    }
    //client.end();
});

function payloadParser(numberField, data_frame) {
    if (numberField <= 0) {
        console.log('Invalid number field !');
        return;
    } else {
        var field_offset = 0;
        var parameter_code, format_type, data_length;
        var data;


        for (var frame_index = 0; frame_index < numberField; frame_index++) {
            //console.log('field_offset: ', field_offset);
            parameter_code = (data_frame[field_offset + 0] << 8) + data_frame[field_offset + 1];
            //console.log('parameter_code: ', parameter_code);
            format_type = Number(data_frame[field_offset + 2]);
            //console.log('format_type: ', format_type);
            data_length = Number((data_frame[field_offset + 3] << 8) + data_frame[field_offset + 4]);
            //console.log('data_length: ', data_length);
            if (data_length == 1) {
                data = data_frame[field_offset + 5];
            } else {
                data = data_frame.slice((field_offset + 5), (field_offset + data_length + 5));
            }
            field_offset += (data_length + 5);
            dataFrameParser(parameter_code, format_type, data_length, data);
        }


        console.log("****************************************\r\n");
    }
}

function dataFrameParser(parameter_code, format_type, data_length, data) {
    var node = new Node({
        sensor_id: node_serial_number,
        sensor_type: "DS18B28",
        temperature: null,
        humidity: null,
        sensor_time: node_send_date
    });
    //console.log('******* parameter_code: ', parameter_code);
    switch (parameter_code) {
        case parameterCode.PARAM_PIN_PERCENT: // Chi so PIN
            //console.log('case parameterCode.PARAM_PIN_PERCENT');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_UNSIGNED_CHAR) {
                //console.log('formatType.FORMAT_UNSIGNED_CHAR: ',formatType.FORMAT_UNSIGNED_CHAR);
                if (Number(data_length) == dataLength.DATA_LEN_UNSIGNED_CHAR) {
                    console.log('---------------------------------> PIN Percent: ', Number(data), '%');
                }
            }
            break;
        case parameterCode.PARAM_CHARGE_STATUS: // Charge Status
            //console.log('case parameterCode.PARAM_CHARGE_STATUS');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_CHAR) {
                //console.log('formatType.FORMAT_CHAR: ',formatType.FORMAT_CHAR);
                if (Number(data_length) == dataLength.DATA_LEN_CHAR) {
                    console.log('---------------------------------> Charge Status: ', String.fromCharCode(data));
                }
            }
            break;
        case parameterCode.PARAM_ADAPTER_DETECT: // Adapter Detect
            //console.log('case parameterCode.PARAM_ADAPTER_DETECT');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_CHAR) {
                //console.log('formatType.FORMAT_CHAR: ',formatType.FORMAT_CHAR);
                if (Number(data_length) == dataLength.DATA_LEN_CHAR) {
                    console.log('---------------------------------> Adapter Detect: ', String.fromCharCode(data));
                }
            }
            break;
        case parameterCode.PARAM_CONSUMPTION: // POwer Consumption
            //console.log('case parameterCode.PARAM_CONSUMPTION');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> Power Consumption: ', dataFloat.readFloatLE(0));
                }
            }
            break;
        case parameterCode.PARAM_ACTIVE_POWER: // Active power
            //console.log('case parameterCode.PARAM_ACTIVE_POWER');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> Active power: ', dataFloat.readFloatLE(0));
                }
            }
            break;
        case parameterCode.PARAM_MAX_DEMAND: // Max demand
            //console.log('case parameterCode.PARAM_MAX_DEMAND');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_SIGNED_INT) {
                //console.log('formatType.FORMAT_SIGNED_INT: ',formatType.FORMAT_SIGNED_INT);
                if (Number(data_length) == dataLength.DATA_LEN_SIGNED_INT) {
                    var signIntData = 0;
                    signIntData = ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]);
                    console.log('---------------------------------> Max demand: ', signIntData);
                }
            }
            break;
        case parameterCode.PARAM_NUMBER_USED: // Number used
            //console.log('case parameterCode.PARAM_NUMBER_USED');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> Temperature: ', dataFloat.readFloatLE(0));
                    node.temperature = dataFloat.readFloatLE(0);
                }
            }
            break;
        case parameterCode.PARAM_REACTIVE_POWER: // Reactive power
            //console.log('case parameterCode.PARAM_REACTIVE_POWER');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> Reactive power: ', dataFloat.readFloatLE(0));
                }
            }
            break;
        case parameterCode.PARAM_RMS_VOLTAGE: // RMS Voltage
            //console.log('case parameterCode.PARAM_RMS_VOLTAGE');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> RMS Voltage: ', dataFloat.readFloatLE(0));
                }
            }
            break;
        case parameterCode.PARAM_RMS_CURRENT: // RMS Current
            //console.log('case parameterCode.PARAM_RMS_CURRENT');
            //console.log('case format_type: ',Number(format_type));
            if (Number(format_type) == formatType.FORMAT_FLOAT_4BYTE) {
                //console.log('formatType.FORMAT_FLOAT_4BYTE: ',formatType.FORMAT_FLOAT_4BYTE);
                if (Number(data_length) == dataLength.DATA_LEN_FLOAT_4BYTE) {
                    var dataFloat = reverse_buffer(data); // Dao thu tu chuoi hex
                    console.log('---------------------------------> RMS Current: ', dataFloat.readFloatLE(0));
                }
            }
            break;
        default:
            console.log('case default: Invalid parameter_code');
            break;
    };

    console.log('Node.temperature: ', node.temperature);
    // Save Node in the database
    node.save()
        .then(data => {
            console.log('Save payload into Database: ', data);


            //res.send(data);
        }).catch(err => {
            console.log('Save Database Error: ', err);
            /*
            res.status(500).send({
            	message: err.message || "Some error occurred while creating the Node."
            });*/
        });

    request(app)
        .get('/updateCacheToday')
        .expect(200)
        .end(function(err, res) {
            if (err) throw err;
            // else 
            // console.log(res);
        });
}

app.listen(port, () => {
    console.log("Server is listening on port: " + port);
});