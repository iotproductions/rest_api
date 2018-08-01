module.exports = (app) => {
    const nodes = require('../controllers/node.controller.js');

    // Create a new Sensor
    app.post('/nodes', nodes.create);

    // Retrieve all Notes
    app.get('/nodes', nodes.findAll);

    // Retrieve a single Sensor with sensorId
    app.get('/nodes/:sensorId', nodes.findOne);

    // Update a Sensor with sensorId
    app.put('/nodes/:sensorId', nodes.update);

    // Delete a Sensor with sensorId
    app.delete('/nodes/:sensorId', nodes.delete);
}