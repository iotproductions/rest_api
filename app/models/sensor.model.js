// Sensor model
const mongoose = require('mongoose');

const SensorSchema = mongoose.Schema({
    SerialNumber: String,
    Temperature: Number,
	Humidity: Number,
	DeviceTime: { type: Date, default: Date.now },
}, {
    timestamps: true
});

module.exports = mongoose.model('Sensor', SensorSchema);