module.exports = (app) => {
    const devices = require('../controllers/device.controller.js');

	app.post('/devices/setMode', devices.setMode);
	
	app.post('/devices/getStatus', devices.getLightStatus);
	
	app.get('/devices/on', devices.turnOn);
	
	app.get('/devices/off', devices.turnOff);
    // Create a new Device
    app.post('/devices', devices.create);

    // Retrieve all devices
    app.get('/devices', devices.findAll);

    // Retrieve a single Device with deviceId
    app.get('/devices/:deviceId', devices.findOne);

    // Update a Device with deviceId
    app.put('/devices/:deviceId', devices.update);

	// Retrieve a single Device with deviceId
    app.put('/devices/status/:SerialNumber', devices.updateStatus);

    // Delete a Device with deviceId
    app.delete('/devices/:deviceId', devices.delete);
}