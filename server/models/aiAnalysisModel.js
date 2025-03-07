const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  model: {
    type: String,
    enum: ['DeepseekR1', 'O1Mini'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  fishAnalysis: {
    phLevel: {
      predicted: [Number],
      accuracy: Number
    },
    temperatureLevel: {
      predicted: [Number],
      accuracy: Number
    },
    tdsLevel: {
      predicted: [Number],
      accuracy: Number
    },
    turbidityLevel: {
      predicted: [Number],
      accuracy: Number
    },
    ecLevel: {
      predicted: [Number],
      accuracy: Number
    }
  },
  plantAnalysis: {
    pressureLevel: {
      predicted: [Number],
      accuracy: Number
    },
    temperatureLevel: {
      predicted: [Number],
      accuracy: Number
    },
    humidityLevel: {
      predicted: [Number],
      accuracy: Number
    }
  },
  overallAccuracy: {
    type: Number,
    default: 0
  },
  comparisonResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

module.exports = AIAnalysis;
