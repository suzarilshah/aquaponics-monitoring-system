const express = require('express');
const router = express.Router();
const {
  getLatestFishTelemetry,
  getLatestPlantTelemetry,
  getFishTelemetryByRange,
  getPlantTelemetryByRange,
  addFishTelemetry,
  addPlantTelemetry,
  pauseTelemetry,
  getCurrentTelemetry,
  getFishTelemetryData,
  getPlantTelemetryData
} = require('../controllers/telemetryController');
const { protect } = require('../middleware/authMiddleware');

// Fish telemetry routes
router.get('/fish/latest', protect, getLatestFishTelemetry);
router.get('/fish', protect, getFishTelemetryByRange);
router.post('/fish', addFishTelemetry); // This would typically be protected with API keys in production

// Plant telemetry routes
router.get('/plant/latest', protect, getLatestPlantTelemetry);
router.get('/plant', protect, getPlantTelemetryByRange);
router.post('/plant', addPlantTelemetry); // This would typically be protected with API keys in production

// Telemetry control
router.post('/pause', protect, pauseTelemetry);

// Real-time telemetry data cycling
router.get('/current', protect, getCurrentTelemetry);

// CSV data endpoints - no authentication for development
router.get('/fish/data', getFishTelemetryData);
router.get('/plant/data', getPlantTelemetryData);

module.exports = router;
