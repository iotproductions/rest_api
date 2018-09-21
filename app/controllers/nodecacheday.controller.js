const NodeCacheDay = require('../models/nodecacheday.model.js');
const Node = require('../models/node.model.js');
var moment = require('moment');
var Async = require('async');

const moment_timezone = require('moment-timezone')

// Create and Save a new NodeCacheDay
exports.create = (req, res) => {
    // Validate request
    if (!req.body.SerialNumber) {
        return res.status(400).send({
            message: "NodeCacheDay SerialNumber can not be empty"
        });
    }

    // Create a NodeCacheDay
    const nodecache = new NodeCacheDay({
        sensor_id: req.body.sensor_id,
        temperature_min_time: new Date(req.body.temperature_min_time),
        temperature_max_time: new Date(req.body.temperature_max_time),
        temperature_min_value: req.body.temperature_min_value,
        temperature_max_value: req.body.temperature_max_value,
        humidity_min_time: new Date(req.body.temperature_min_time),
        humidity_max_time: new Date(req.body.temperature_max_time),
        humidity_min_value: req.body.temperature_min_value,
        humidity_max_value: req.body.temperature_max_value,
        dayCheck: req.body.dayCheck,
        monthCheck: req.body.monthCheck,
        yearCheck: req.body.yearCheck
    });

    // Save NodeCacheDay in the database
    nodecache.save()
        .then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the NodeCacheDay."
            });
        });
};

exports.updateCachToday = (req, res) => {
    const timeZone = 'Asia/Ho_Chi_Minh' // Timezone: 'UTC+07:00'
    var moment_now = moment.tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
    console.log("moment_now: ", moment_now);
    var now = moment(moment_now, 'YYYY/MM/DD');
    console.log("now: ", now);
    var now_month = now.format('M');
    var now_day = now.format('D');
    var now_year = now.format('YYYY');
    var start_day = moment.tz(timeZone).startOf('day').utc();
    var end_day = moment.tz(timeZone).endOf('day').utc();
    console.log("start_day: ", start_day, " end_day: ", end_day);
    var get_min_max = {
        maximum_temperature_today: function (callback) {
            get_max = Node.find({
                sensor_id: "H2168R1S001N001",
                sensor_time: {
                    $gte: new Date(start_day.toISOString()),
                    $lt: new Date(end_day.toISOString())
                }
            }).sort({
                "temperature": -1
            }).limit(1);

            get_max.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        },
        minimum_temperature_today: function (callback) {
            get_min = Node.find({
                sensor_id: "H2168R1S001N001",
                sensor_time: {
                    $gte: new Date(start_day.toISOString()),
                    $lt: new Date(end_day.toISOString())
                }
            }).sort({
                "temperature": 1
            }).limit(1);

            get_min.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        },
        average_temperature_today: function (callback) {
            get_average = Node.aggregate([{
                $match: {
                    sensor_id: "H2168R1S001N001",
                    sensor_time: {
                        $gte: new Date(start_day.toISOString()),
                        $lt: new Date(end_day.toISOString())
                    }
                }
            }, {
                $group: {
                    _id: null,
                    average_temperature: {
                        $avg: "$temperature"
                    }
                }
            }]);

            get_average.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        }
    };

    Async.parallel(get_min_max, function (err, results) {
        if (err)
            throw err;
        //results holds the data in object form

        var str_result = JSON.stringify(results);
        var obj_result = JSON.parse(str_result)

        var nodecache = {
            temperature_min_value: obj_result.minimum_temperature_today[0].temperature,
            temperature_min_time: obj_result.minimum_temperature_today[0].sensor_time,
            temperature_max_value: obj_result.maximum_temperature_today[0].temperature,
            temperature_max_time: obj_result.maximum_temperature_today[0].sensor_time,
            dayCheck: now_day,
            monthCheck: now_month,
            yearCheck: now_year,
            sensor_id: obj_result.maximum_temperature_today[0].sensor_id
        };

        NodeCacheDay.findOneAndUpdate(
            {
                dayCheck: now_day,
                monthCheck: now_month,
                yearCheck: now_year
            }, // find a document with that filter
            nodecache, // document to insert when nothing was found
            { upsert: true, new: true, runValidators: true }, // options
            function (err, nodecache) { // callback
                if (err) {
                    // handle error
                    res.status(500).send({
                        message: err.message || "Some error occurred while creating the Node."
                    });
                } else {
                    // handle document
                    res.send({
                        status: true,
                        payload: nodecache
                    });
                }
            }
        );
    });
};


exports.updateCacheByDate = (req, res) => {

    const timeZone = 'Asia/Ho_Chi_Minh' // 'UTC+04:00'
    console.log("From: " + req.query.FromDate);
    // for the today 

    var start_day = moment(req.query.FromDate).tz(timeZone).startOf('day').utc();
    var end_day = moment(req.query.FromDate).tz(timeZone).endOf('day').utc();
    console.log("start_day: " + start_day);
    console.log("end_day: " + end_day);
    console.log("call findFromDateToDate From: " + start_day + " To: " + end_day);
    var now_month = moment(req.query.FromDate).tz(timeZone).utc().format('M');
    var now_day = moment(req.query.FromDate).tz(timeZone).utc().format('D');
    var now_year = moment(req.query.FromDate).tz(timeZone).utc().format('YYYY');


    var get_min_max = {
        maximum_temperature_today: function (callback) {
            get_max = Node.find({
                sensor_id: "H2168R1S001N001",
                sensor_time: {
                    $gte: new Date(start_day.toISOString()),
                    $lt: new Date(end_day.toISOString())
                }
            }).sort({
                "temperature": -1
            }).limit(1);

            get_max.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        },
        minimum_temperature_today: function (callback) {
            get_min = Node.find({
                sensor_id: "H2168R1S001N001",
                sensor_time: {
                    $gte: new Date(start_day.toISOString()),
                    $lt: new Date(end_day.toISOString())
                }
            }).sort({
                "temperature": 1
            }).limit(1);

            get_min.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        },
        average_temperature_today: function (callback) {
            get_average = Node.aggregate([{
                $match: {
                    sensor_id: "H2168R1S001N001",
                    sensor_time: {
                        $gte: new Date(start_day.toISOString()),
                        $lt: new Date(end_day.toISOString())
                    }
                }
            }, {
                $group: {
                    _id: null,
                    average_temperature: {
                        $avg: "$temperature"
                    }
                }
            }]);

            get_average.exec(function (err, data) {
                if (err)
                    return callback(err)

                callback(null, data);
            });
        }
    };

    Async.parallel(get_min_max, function (err, results) {
        if (err)
            throw err;
        //results holds the data in object form

        var str_result = JSON.stringify(results);
        var obj_result = JSON.parse(str_result)
        //console.log(obj_result);

        // Create a Node
        var nodecache = new NodeCacheDay();
        nodecache.temperature_min_value = obj_result.minimum_temperature_today[0].temperature;
        nodecache.temperature_min_time = obj_result.minimum_temperature_today[0].sensor_time;
        nodecache.temperature_max_value = obj_result.maximum_temperature_today[0].temperature;
        nodecache.temperature_max_time = obj_result.maximum_temperature_today[0].sensor_time;
        nodecache.dayCheck = now_day;
        nodecache.monthCheck = now_month;
        nodecache.yearCheck = now_year;
        nodecache.sensor_id = obj_result.maximum_temperature_today[0].sensor_id;
        console.log("nodecache", nodecache);
        delete nodecache._id;

        NodeCacheDay.findOneAndUpdate(
            {
                dayCheck: now_day,
                monthCheck: now_month,
                yearCheck: now_year
            }, // find a document with that filter
            nodecache, // document to insert when nothing was found
            { upsert: true, returnOriginal: false, runValidators: true }, // options
            function (err, doc) { // callback
                if (err) {
                    // handle error
                    res.status(500).send({
                        message: err.message || "Some error occurred while creating the Node."
                    });
                } else {
                    // handle document
                    res.send({
                        status: true,
                        payload: doc
                    });
                }
            }
        );

        // NodeCacheDay.count({
        //     dayCheck: now_day,
        //     monthCheck: now_month,
        //     yearCheck: now_year
        // }, function(err, cacheday) {
        //     if (cacheday > 0) //document exists
        //     {
        //         console.log("Document exists, update documents: ", cacheday);
        //         res.send({
        //             status: true,
        //             payload: nodecache
        //         });
        //     } else // Document not found, create new one
        //     {
        //         // Save Node in the database
        //         console.log("Document not found, create new one");
        //         nodecache.save()
        //             .then(data => {
        //                 res.send(data);
        //             }).catch(err => {
        //                 res.status(500).send({
        //                     message: err.message || "Some error occurred while creating the Node."
        //                 });
        //             });
        //     }
        // });


    });
};

/*
	// console.log("call findFromDateToDate From: " + start_day.toISOString() + " To: " +  end_day.toISOString());	
	var minimum_temperature_documents;
	var maximum_temperature_documents;

	Node.find({
		sensor_id: "H2168R1S001N001",
		sensor_time: {
			$gte: new Date(start_day.toISOString()),
			$lt: new Date(end_day.toISOString())
		}
	}).sort({
		"temperature": -1
	}).limit(1).exec(function (err, nodes) {
		maximum_temperature_documents = (nodes);
		console.log("maximum_temperature_index: " + (maximum_temperature_documents));
	});

	Node.find({
		sensor_id: "H2168R1S001N001",
		sensor_time: {
			$gte: new Date(start_day.toISOString()),
			$lt: new Date(end_day.toISOString())
		}
	}).sort({
		"temperature": 1
	}).limit(1).exec(function (err, nodes) {
		minimum_temperature_documents = (nodes);
		console.log("minimum_temperature_index: " + (minimum_temperature_documents));
	});

	
	// send response to client
	res.send({
		status: true,
		length: 2,
		maximum_temperature_documents: maximum_temperature_documents,
		maximum_temperature_documents: maximum_temperature_documents
	});
	//  Node.aggregate([
	//   {$group: {
	// 	  _id: "$temperature",
	// 	  my_winner: {$push: "$$ROOT"}
	//   }},
	//   {$sort:{_id:-1}},
	//   {$limit:1}  ]).exec(function (err, node_max) {
	// 			console.log("Node.count: ", node_max)
	//   });				

	// Node.aggregate([ 
	// 	{ $match :{sensor_id: "H2168R1S001N001" , sensor_time: {$gte:  new Date(start_day.toISOString()), $lt:  new Date(end_day.toISOString())}}}
	// 	,{
	// 		$group: {
	// 		  _id: null,
	// 		  /*total: {
	// 			$sum: "$temperature"
	// 		  },*/
// 		  average_temperature: {
// 			$avg: "$temperature"
// 		  },
// 		  min_temperature: {
// 			$min: "$temperature"
// 		  },
// 		  max_temperature: {
// 			$max: "$temperature"
// 		  }
// 		}
// 	  }
// ]).exec(function (err, nodes) {
// 	console.log(" Node.aggregate: ", nodes);
// 	console.log(" Node.aggregate.length: ", nodes.length);
// });
/*
	NodeCacheDay.count({dayCheck: now_day, monthCheck: now_month, yearCheck: now_year}, function (err, cacheday)
	{ 
		if(cacheday > 0 ) //document exists
		{
			res.status(200).send({
				status: true,
				minimum_temperature_documents: minimum_temperature_documents,
				maximum_temperature_documents:maximum_temperature_documents
			});
		}
		else // Document not found, create new one
		{
			console.log(" Document not found, create new one");
			// Tim gia tri nhiet do lon nhat hom nay
			Node.findOne({sensor_time: {$gte: start_day, $lt: end_day}}).exec(function (err, nodes) {
				console.log("Node.count: ", nodes);
				//res.send({status: true, length: nodes.length, payload: nodes});			
				if(nodes > 0 ) //document exists
				{
					console.log("Du lieu hom nay : ", nodes);
					res.send({status: true, length: nodes.length, payload: nodes});
				}
				else 
				{
					console.log("Hom nay khong co du lieu !");
					    // Create a Node
					const nodecache = new NodeCacheDay({
						sensor_id: nodes.sensor_id, 
						//temperature_min_time: new Date(req.body.temperature_min_time),		
						temperature_max_time: nodes.sensor_time,
						//temperature_min_value: req.body.temperature_min_value,
						temperature_max_value: nodes.temperature,
						//humidity_min_time: new Date(req.body.temperature_min_time),		
						//humidity_max_time: new Date(req.body.temperature_max_time),
						//humidity_min_value: req.body.temperature_min_value,
						//humidity_max_value: req.body.temperature_max_value,
						dayCheck: now_day,
						monthCheck: now_month,
						yearCheck: now_year
					});
					// Save Node in the database
					nodecache.save()
					.then(data => {
						res.send(data);
					}).catch(err => {
						res.status(500).send({
							message: err.message || "Some error occurred while creating the Node."
						});
					});
				}
			});
		}
	}); 
*/

// Retrieve and return all nodes from the database.
exports.findAll = (req, res) => {
    NodeCacheDay.find().sort({
        yearCheck: 1,
        monthCheck: 1,
        dayCheck: 1

    }).limit(31).exec(function (err, nodes) {
        res.send({
            status: true,
            length: nodes.length,
            payload: nodes
        });
    });
};

/*
// Retrieve and return nodes from date to date.
exports.findFromDateToDate = (req, res) => {
	console.log("From: " + req.query.FromDate);
    console.log("To: " + req.query.ToDate);	
	console.log("Device ID: " + req.query.Serial);
	var start_date = moment((req.query.FromDate), 'DD/MM/YYYY').tz("Asia/Ho_Chi_Minh").toDate(); 
	var end_date   = moment((req.query.ToDate), 'DD/MM/YYYY').tz("Asia/Ho_Chi_Minh").toDate();  
    console.log("call findFromDateToDate From: " + start_date + " To: " + end_date);	
    NodeCacheDay.find({sensor_time: {$gte: start_date, $lt: end_date},sensor_id: req.query.Serial}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};


// Retrieve and return nodes at current date
exports.getNodesToday = (req, res) => {
	
	const timeZone = 'Asia/Ho_Chi_Minh' // 'UTC+04:00'

	// for the today 
	var start_day = moment.tz(timeZone).startOf('day').utc();
	var end_day = moment.tz(timeZone).endOf('day').utc();
	console.log("start_day: " + start_day);
    console.log("end_day: " + end_day );	
	console.log("call findFromDateToDate From: " + start_day + " To: " + end_day);	

	NodeCacheDay.find({sensor_time: {$gte: start_day, $lt: end_day}}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};



// Retrieve and return nodes at current date
exports.getNodesByDate = (req, res) => {
	
	const timeZone = 'Asia/Ho_Chi_Minh' // 'UTC+04:00'
	console.log("From: " + req.query.FromDate);
	// for the today 
	var start_day = moment(req.query.FromDate).tz(timeZone).startOf('day').utc();
	var end_day = moment(req.query.FromDate).tz(timeZone).endOf('day').utc();
	console.log("start_day: " + start_day);
    console.log("end_day: " + end_day );	
	console.log("call findFromDateToDate From: " + start_day + " To: " + end_day);	

	NodeCacheDay.find({sensor_time: {$gte: start_day, $lt: end_day}}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};


// Find a single nodecache with a nodeId
exports.findOne = (req, res) => {
    NodeCacheDay.findById(req.params.nodeId)
    .then(nodecache => {
        if(!nodecache) {
            return res.status(404).send({
                message: "NodeCacheDay not found with id " + req.params.nodeId
            });            
        }
        res.send(nodecache);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "NodeCacheDay not found with id " + req.params.nodeId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving nodecache with id " + req.params.nodeId
        });
    });
};
*/
// Update a nodecache identified by the nodeId in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body.SerialNumber) {
        return res.status(400).send({
            message: "NodeCacheDay SerialNumber can not be empty"
        });
    }

    // Find nodecache and update it with the request body
    NodeCacheDay.findByIdAndUpdate(req.params.nodeId, {
        sensor_id: req.body.sensor_id,
        temperature_min_time: new Date(req.body.temperature_min_time),
        temperature_max_time: new Date(req.body.temperature_max_time),
        temperature_min_value: req.body.temperature_min_value,
        temperature_max_value: req.body.temperature_max_value,
        humidity_min_time: new Date(req.body.temperature_min_time),
        humidity_max_time: new Date(req.body.temperature_max_time),
        humidity_min_value: req.body.temperature_min_value,
        humidity_max_value: req.body.temperature_max_value,
        dayCheck: req.body.dayCheck,
        monthCheck: req.body.monthCheck,
        yearCheck: req.body.yearCheck
    }, {
            new: true
        })
        .then(nodecache => {
            if (!nodecache) {
                return res.status(404).send({
                    message: "NodeCacheDay not found with id " + req.params.nodeId
                });
            }
            res.send(nodecache);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "NodeCacheDay not found with id " + req.params.nodeId
                });
            }
            return res.status(500).send({
                message: "Error updating nodecache with id " + req.params.nodeId
            });
        });
};

// Delete a nodecache with the specified nodeId in the request
exports.delete = (req, res) => {
    NodeCacheDay.findByIdAndRemove(req.params.nodeId)
        .then(nodecache => {
            if (!nodecache) {
                return res.status(404).send({
                    message: "NodeCacheDay not found with id " + req.params.nodeId
                });
            }
            res.send({
                message: "NodeCacheDay deleted successfully!"
            });
        }).catch(err => {
            if (err.kind === 'ObjectId' || err.name === 'NotFound') {
                return res.status(404).send({
                    message: "NodeCacheDay not found with id " + req.params.nodeId
                });
            }
            return res.status(500).send({
                message: "Could not delete nodecache with id " + req.params.nodeId
            });
        });
};