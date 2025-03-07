const express = require('express');
const router = express.Router();
const {
  runAnalysis,
  getAnalyses,
  getAnalysisById
} = require('../controllers/aiAnalysisController');
const { protect } = require('../middleware/authMiddleware');

// AI Analysis routes
router.post('/run', protect, runAnalysis);
router.get('/', protect, getAnalyses);
router.get('/:id', protect, getAnalysisById);

module.exports = router;
