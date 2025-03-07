const mongoose = require('mongoose');

const fishTelemetrySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  phLevel: {
    type: Number,
    required: true
  },
  temperatureLevel: {
    type: Number,
    required: true
  },
  tdsLevel: {
    type: Number,
    required: true
  },
  turbidityLevel: {
    type: Number,
    required: true
  },
  ecLevel: {
    type: Number,
    required: true
  }
});

const FishTelemetry = mongoose.model('FishTelemetry', fishTelemetrySchema);

module.exports = FishTelemetry;
