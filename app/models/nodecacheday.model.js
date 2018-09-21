//test
// Sensor model
const mongoose = require('mongoose');

const NodeCacheDaySchema = mongoose.Schema({
    sensor_id: String,
	temperature_min_time: { type: Date, default: Date.now },
	temperature_max_time: { type: Date, default: Date.now },
	temperature_min_value: Number,
	temperature_max_value: Number,
	humidity_min_time: { type: Date, default: Date.now },
	humidity_max_time: { type: Date, default: Date.now },
	humidity_min_value: Number,
	humidity_max_value: Number,
	dayCheck: Number,
	monthCheck: Number,
	yearCheck: Number
},{
    timestamps: true
});

module.exports = mongoose.model('NodeCacheDay', NodeCacheDaySchema);