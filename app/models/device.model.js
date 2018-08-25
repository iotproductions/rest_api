// Device model
const mongoose = require('mongoose');

const DeviceSchema = mongoose.Schema({
    SerialNumber: String,
    DeviceName: String,
	DeviceStatus: Number,
	Description: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('Device', DeviceSchema);