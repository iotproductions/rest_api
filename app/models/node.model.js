// Sensor model
const mongoose = require('mongoose');

const NodeSchema = mongoose.Schema({
    sensor_id: String,
    sensor_type: String,
	sensor_time: { type: Date, default: Date.now },
	temperature: Number,
	humidity: Number
},{
    timestamps: true
});

module.exports = mongoose.model('Node', NodeSchema);