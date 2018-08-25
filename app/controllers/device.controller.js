const Device = require('../models/device.model.js');
var mqtt = require('mqtt')


var client = mqtt.connect(
	{ 	
		host: 'smarthome.myftp.org', 
		port: 1883, 
		keepalive: 60000,
		username: 'trieu.le',
		password: 'trieu.le',
		protocolId: 'MQIsdp',
		protocolVersion: 3
	});

client.on('connect', function()
{
    console.log('Connected to Broker');
	// Subcribe all topic
	client.subscribe('W/#');
});

client.on('message', function (topic, message) 
{
  // message is Buffer
  console.log(topic.toString());
  console.log(message.toString());
  
  /*
	var publish_options = {
		  retain:false,
		  qos: 1
	  };	
	  client.publish('W/AWD/TB/22710002', TxBuffer,publish_options);
	  console.log('Publish message to AWD 2 Thai Binh');
  */
});
// Returns a random integer between min (included) and max (included)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
client.on('close', function () {
  // Reconnect to Broker
  client = mqtt.connect(
	{ 	
		host: 'smarthome.myftp.org', 
		port: 1883, 
		keepalive: 60000,
		username: 'trieu.le',
		password: 'trieu.le',
		protocolId: 'MQIsdp',
		protocolVersion: 3
	});
});

exports.setMode = (req, res) => {
	// Validate request
    if(!req.body.mode) {
        return res.status(400).send({
            status: "error", message: "Light mode can not be empty"
        });
    }
	var publish_options = {
	  retain:false,
	  qos: 1
	};	
	var light_mode = parseInt(req.body.mode);
	if(light_mode == 3)
	{
		var red_value = parseInt(req.body.red);
		var green_value = parseInt(req.body.green);
		var blue_value = parseInt(req.body.blue);
	}
	var message = JSON.stringify({ "id": 100, "method": "Light.Mode", "src": "Smart_Light_Status", "params": {"mode": light_mode,"red":red_value,"green":green_value, "blue":blue_value} });
	client.publish('H0148R1S001N001/rpc', message,publish_options);
	
	return res.status(200).send({
		status: "success", message: "Change color of the light !"
	});
};


exports.getLightStatus = (req, res) => {
	 if(!req.body.SerialNumber) {
        return res.status(400).send({
            status: "error", message: "Light SerialNumber can not be empty"
        });
    }
	var device_serial = req.body.SerialNumber + '/rpc';
	var publish_options = {
	  retain:false,
	  qos: 1
	};	
	var message = JSON.stringify({ "getStatus": true});
	
	client.publish('device/light/set', message,publish_options);

	return res.status(200).send({
		status: "success",message: "Get status success"
	});
};


exports.turnOn = (req, res) => {
	var publish_options = {
		  retain:false,
		  qos: 1
	  };	
	  var message = JSON.stringify({"state": "ON","effect":"rainbow","brightness":45,"transition":5000});
	  client.publish('device/light/set', message,publish_options);
		return res.status(200).send({
            message: "Turn on the light !"
        });
};

exports.turnOff = (req, res) => {
	var publish_options = {
		  retain:false,
		  qos: 1
	  };	
	  var message = JSON.stringify({"state": "OFF"});
	  client.publish('device/light/set', message,publish_options);
		return res.status(200).send({
            message: "Turn off the light !"
        });
};
// Create and Save a new Device
exports.create = (req, res) => {
    // Validate request
    if(!req.body.SerialNumber) {
        return res.status(400).send({
            message: "Device SerialNumber can not be empty"
        });
    }

    // Create a Device
    const device = new Device({
        SerialNumber: req.body.SerialNumber, 
        DeviceName: req.body.DeviceName,
		DeviceStatus: req.body.DeviceStatus,
		Description: req.body.Description
    });

    // Save Device in the database
    device.save()
    .then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the Device."
        });
    });
};

// Retrieve and return all devices from the database.
exports.findAll = (req, res) => {
    Device.find()
    .then(devices => {
		
        res.send({status: true, length: devices.length, payload: devices});
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving devices."
        });
    });
};

// Find a single device with a deviceId
exports.findOne = (req, res) => {
    Device.findById(req.params.deviceId)
    .then(device => {
        if(!device) {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });            
        }
        res.send(device);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving device with id " + req.params.deviceId
        });
    });
};

// Update a device identified by the deviceId in the request
exports.update = (req, res) => {
    // Validate Request
    if(!req.body.SerialNumber) {
        return res.status(400).send({
            message: "Device SerialNumber can not be empty"
        });
    }

    // Find device and update it with the request body
    Device.findByIdAndUpdate(req.params.deviceId, {
        SerialNumber: req.body.SerialNumber, 
        DeviceName: req.body.DeviceName,
		DeviceStatus: req.body.DeviceStatus,
		Description: req.body.Description
    }, {new: true})
    .then(device => {
        if(!device) {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });
        }
        res.send(device);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });                
        }
        return res.status(500).send({
            message: "Error updating device with id " + req.params.deviceId
        });
    });
};

// Update status of a device identified by the SerialNumber in the request
exports.updateStatus = (req, res) => {
    Device.findOneAndUpdate({SerialNumber: req.params.SerialNumber}, {$set:{
		DeviceStatus: req.body.DeviceStatus
    }}, {new: true})
    .then(device => {
        if(!device) {
            return res.status(404).send({
                message: "Device not found with SerialNumber " + req.params.SerialNumber
            });
        }
        res.send(device);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).send({
                message: "Device not found with SerialNumber " + req.params.SerialNumber
            });                
        }
        return res.status(500).send({
            message: "Error updating device with SerialNumber " + req.params.SerialNumber
        });
    });
};


// Delete a device with the specified deviceId in the request
exports.delete = (req, res) => {
    Device.findByIdAndRemove(req.params.deviceId)
    .then(device => {
        if(!device) {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });
        }
        res.send({message: "Device deleted successfully!"});
    }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
            return res.status(404).send({
                message: "Device not found with id " + req.params.deviceId
            });                
        }
        return res.status(500).send({
            message: "Could not delete device with id " + req.params.deviceId
        });
    });
};
