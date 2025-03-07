const mongoose = require('mongoose');

const plantTelemetrySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  pressureLevel: {
    type: Number,
    required: true
  },
  temperatureLevel: {
    type: Number,
    required: true
  },
  humidityLevel: {
    type: Number,
    required: true
  },
  plantHeight: {
    type: Number,
    required: true,
    description: 'Plant height in centimeters measured by ultrasonic sensor'
  }
});

const PlantTelemetry = mongoose.model('PlantTelemetry', plantTelemetrySchema);

module.exports = PlantTelemetry;
