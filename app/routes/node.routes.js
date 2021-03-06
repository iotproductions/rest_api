module.exports = (app) => {
    const nodes = require('../controllers/node.controller.js');

    // Create a new Sensor
    app.post('/nodes', nodes.create);

	// Retrieve all Nodes
    app.get('/nodes/GetChartFromDateToDate', nodes.findFromDateToDate);

	// Retrieve all Nodes
    app.get('/nodes/getChartToday', nodes.getNodesToday);
	
	// Retrieve all Nodes
	app.get('/nodes/getChartByADate', nodes.getNodesByDate);

    // Retrieve all Nodes
    app.get('/nodes', nodes.findAll);

    // Retrieve a single Sensor with nodeId
    app.get('/nodes/:nodeId', nodes.findOne);

    // Update a Sensor with nodeId
    app.put('/nodes/:nodeId', nodes.update);

    // Delete a Sensor with nodeId
    app.delete('/nodes/:nodeId', nodes.delete);
}