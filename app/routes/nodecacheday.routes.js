module.exports = (app) => {
    const node_cache = require('../controllers/nodecacheday.controller.js');

    // Create a new Sensor
    app.post('/nodecachedays', node_cache.create);

    // Retrieve all Nodes
    app.get('/getnodecacheday', node_cache.findAll);


    // UPdate cache of a special day
    app.get('/updateCacheByDate', node_cache.updateCacheByDate);


    // Update cache of to day
    app.get('/updateCacheToday', node_cache.updateCachToday);

    // Update a Sensor with nodeId
    app.put('/nodecachedays/:nodeId', node_cache.update);

    // Delete a Sensor with nodeId
    app.delete('/nodecachedays/:nodeId', node_cache.delete);
}