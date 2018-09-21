const Node = require('../models/node.model.js');
var moment = require('moment');
const moment_timezone = require('moment-timezone')

// Create and Save a new Node
exports.create = (req, res) => {
    // Validate request
    if(!req.body.SerialNumber) {
        return res.status(400).send({
            message: "Node SerialNumber can not be empty"
        });
    }

    // Create a Node
    const node = new Node({
        sensor_id: req.body.sensor_id, 
        sensor_type: req.body.sensor_type, 
		temperature: req.body.temperature,
		humidity: req.body.humidity,
		sensor_time: new Date(req.body.sensor_time)
    });

    // Save Node in the database
    node.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the Node."
        });
    });
};

// Retrieve and return all nodes from the database.
exports.findAll = (req, res) => {
    Node.find().sort({sensor_time: -1}).limit(96).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};


// Retrieve and return nodes from date to date.
exports.findFromDateToDate = (req, res) => {
	console.log("From: " + req.query.FromDate);
    console.log("To: " + req.query.ToDate);	
	console.log("Device ID: " + req.query.Serial);
	var start_date = moment((req.query.FromDate), 'DD/MM/YYYY').tz("Asia/Ho_Chi_Minh").toDate(); 
	var end_date   = moment((req.query.ToDate), 'DD/MM/YYYY').tz("Asia/Ho_Chi_Minh").toDate();  
    console.log("call findFromDateToDate From: " + start_date + " To: " + end_date);	
    Node.find({sensor_time: {$gte: start_date, $lt: end_date},sensor_id: req.query.Serial}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};


// Retrieve and return nodes at current date
exports.getNodesToday = (req, res) => {
	
	const timeZone = 'Asia/Ho_Chi_Minh' // 'UTC+04:00'
	/*
	var start = moment().startOf('day'); // set to 12:00 am today
	var end = moment().endOf('day');     // set to 23:59 pm today
	var start_tz = moment_timezone.tz(start,'YYYY-MM-DD HH:mm',timeZone).utc();
	var end_tz = moment_timezone.tz(end,'YYYY-MM-DD HH:mm',timeZone).utc();
	console.log("From: " + start + " , Timezone: " + start_tz);
    console.log("To: " + end + " , Timezone: " + end_tz);	
	*/
	//var max_temperature_today = 0;
	//var max_temperature_time;
	// for the today 
	var start_day = moment.tz(timeZone).startOf('day').utc();
	var end_day = moment.tz(timeZone).endOf('day').utc();
	console.log("start_day: " + start_day);
    console.log("end_day: " + end_day );	
	console.log("call findFromDateToDate From: " + start_day + " To: " + end_day);	
/*
	Node.findOne({sensor_time: {$gte: start_day, $lt: end_day}})
	.sort('-temperature')  // give me the max
	.exec(function (err, node) {
		// your callback code
		max_temperature_today = node.temperature;
		max_temperature_time = node.sensor_time;
		console.log("max_temperature_today: " + max_temperature_today);
		console.log("max_temperature_time: " + max_temperature_time);
	  });
	*/
	Node.find({sensor_time: {$gte: start_day, $lt: end_day}}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};



// Retrieve and return nodes at current date
exports.getNodesByDate = (req, res) => {
	
	const timeZone = 'Asia/Ho_Chi_Minh' // 'UTC+04:00'
	/*
	var start = moment().startOf('day'); // set to 12:00 am today
	var end = moment().endOf('day');     // set to 23:59 pm today
	var start_tz = moment_timezone.tz(start,'YYYY-MM-DD HH:mm',timeZone).utc();
	var end_tz = moment_timezone.tz(end,'YYYY-MM-DD HH:mm',timeZone).utc();
	console.log("From: " + start + " , Timezone: " + start_tz);
    console.log("To: " + end + " , Timezone: " + end_tz);	
	*/
	console.log("From: " + req.query.FromDate);
	// for the today 
	var start_day = moment(req.query.FromDate).tz(timeZone).startOf('day').utc();
	var end_day = moment(req.query.FromDate).tz(timeZone).endOf('day').utc();
	console.log("start_day: " + start_day);
    console.log("end_day: " + end_day );	
	console.log("call findFromDateToDate From: " + start_day + " To: " + end_day);	

	Node.find({sensor_time: {$gte: start_day, $lt: end_day}}).exec(function(err, nodes){
		res.send({status: true, length: nodes.length, payload: nodes});
	});
};


// Find a single node with a nodeId
exports.findOne = (req, res) => {
    Node.findById(req.params.nodeId)
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });            
        }
        res.send(node);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving node with id " + req.params.nodeId
        });
    });
};

// Update a node identified by the nodeId in the request
exports.update = (req, res) => {
    // Validate Request
    if(!req.body.SerialNumber) {
        return res.status(400).send({
            message: "Node SerialNumber can not be empty"
        });
    }

    // Find node and update it with the request body
    Node.findByIdAndUpdate(req.params.nodeId, {
        sensor_id: req.body.sensor_id, 
        sensor_type: req.body.sensor_type, 
		temperature: req.body.temperature,
		humidity: req.body.humidity,
		sensor_time: new Date(req.body.sensor_time)
    }, {new: true})
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });
        }
        res.send(node);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });                
        }
        return res.status(500).send({
            message: "Error updating node with id " + req.params.nodeId
        });
    });
};

// Delete a node with the specified nodeId in the request
exports.delete = (req, res) => {
    Node.findByIdAndRemove(req.params.nodeId)
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });
        }
        res.send({message: "Node deleted successfully!"});
    }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.nodeId
            });                
        }
        return res.status(500).send({
            message: "Could not delete node with id " + req.params.nodeId
        });
    });
};
