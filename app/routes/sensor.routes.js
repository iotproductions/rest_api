module.exports = (app) => {
    const sensors = require('../controllers/sensor.controller.js');

    // Create a new Sensor
    app.post('/sensors', sensors.create);

    // Retrieve all Notes
    app.get('/sensors', sensors.findAll);

    // Retrieve a single Sensor with sensorId
    app.get('/sensors/:sensorId', sensors.findOne);

    // Update a Sensor with sensorId
    app.put('/sensors/:sensorId', sensors.update);

    // Delete a Sensor with sensorId
    app.delete('/sensors/:sensorId', sensors.delete);
}