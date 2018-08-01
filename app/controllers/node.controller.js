const Node = require('../models/node.model.js');

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
    Node.find()
    .then(nodes => {
		
        res.send({status: true, length: nodes.length, payload: nodes});
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving nodes."
        });
    });
};

// Find a single node with a sensorId
exports.findOne = (req, res) => {
    Node.findById(req.params.sensorId)
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });            
        }
        res.send(node);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving node with id " + req.params.sensorId
        });
    });
};

// Update a node identified by the sensorId in the request
exports.update = (req, res) => {
    // Validate Request
    if(!req.body.SerialNumber) {
        return res.status(400).send({
            message: "Node SerialNumber can not be empty"
        });
    }

    // Find node and update it with the request body
    Node.findByIdAndUpdate(req.params.sensorId, {
        sensor_id: req.body.sensor_id, 
        sensor_type: req.body.sensor_type, 
		temperature: req.body.temperature,
		humidity: req.body.humidity,
		sensor_time: new Date(req.body.sensor_time)
    }, {new: true})
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });
        }
        res.send(node);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });                
        }
        return res.status(500).send({
            message: "Error updating node with id " + req.params.sensorId
        });
    });
};

// Delete a node with the specified sensorId in the request
exports.delete = (req, res) => {
    Node.findByIdAndRemove(req.params.sensorId)
    .then(node => {
        if(!node) {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });
        }
        res.send({message: "Node deleted successfully!"});
    }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
            return res.status(404).send({
                message: "Node not found with id " + req.params.sensorId
            });                
        }
        return res.status(500).send({
            message: "Could not delete node with id " + req.params.sensorId
        });
    });
};
