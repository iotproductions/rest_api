const express = require('express');
const bodyParser = require('body-parser');
var morgan   = require('morgan');
// create express app
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// Fix loi Access-Control-Allow-Origin
app.use(function(req, res, next) { res.header('Access-Control-Allow-Origin', "*"); 
	res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE'); 
	res.header('Access-Control-Allow-Headers', 'Content-Type'); 
	next();
})


// parse application/json
app.use(bodyParser.json())
app.use(morgan('dev')); 					// log every request to the console
// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
// MongoDB connection options
const connectOptions = { 
  useMongoClient: true,
  autoReconnect: true
};
// Create MongoDB connection
var db = mongoose.connection;
// Connecting to MongoDB 
db.on('connecting', function() 
{
	console.log('connecting to MongoDB...');
});
// Error issues during connect to MongoDB 
db.on('error', function(error) 
{
	console.error('Error in MongoDb connection: ' + error);
	mongoose.disconnect();
});
// Connected to MongoDB 
db.on('connected', function() 
{
	console.log('MongoDB connected!');
});

// Reconnecting to MongoDB 
db.on('reconnected', function () 
{
	console.log('MongoDB reconnected!');
});
// Disconnected to MongoDB 
db.on('disconnected', function() 
{
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
    res.json({"message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes."});
});

require('./app/routes/note.routes.js')(app);
require('./app/routes/sensor.routes.js')(app);
require('./app/routes/node.routes.js')(app);
// listen for requests
app.listen(5566, () => {
    console.log("Server is listening on port 5566");
});