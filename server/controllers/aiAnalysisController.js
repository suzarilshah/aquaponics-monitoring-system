const AIAnalysis = require('../models/aiAnalysisModel');
const FishTelemetry = require('../models/fishTelemetryModel');
const PlantTelemetry = require('../models/plantTelemetryModel');
const User = require('../models/userModel');
const { sendEmail } = require('../services/emailService');

// Helper function to calculate Mean Absolute Percentage Error (MAPE)
const calculateMAPE = (actual, predicted) => {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }

  const sumOfPercentageErrors = actual.reduce((sum, actualValue, index) => {
    if (actualValue === 0) return sum; // Avoid division by zero
    return sum + Math.abs((actualValue - predicted[index]) / actualValue);
  }, 0);

  return (1 - (sumOfPercentageErrors / actual.length)) * 100; // Return as percentage accuracy
};

// @desc    Run AI analysis
// @route   POST /api/analysis/run
// @access  Private
const runAnalysis = async (req, res) => {
  try {
    const { model, startDate, endDate } = req.body;
    
    if (!model || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide model, startDate, and endDate' });
    }
    
    // Validate model
    if (!['DeepseekR1', 'O1Mini'].includes(model)) {
      return res.status(400).json({ message: 'Model must be either DeepseekR1 or O1Mini' });
    }
    
    // Get fish telemetry data
    const fishData = await FishTelemetry.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ timestamp: 1 });
    
    // Get plant telemetry data
    const plantData = await PlantTelemetry.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ timestamp: 1 });
    
    if (fishData.length === 0 || plantData.length === 0) {
      return res.status(404).json({ message: 'Not enough data for analysis in the specified time range' });
    }
    
    // In a real application, here we would:
    // 1. Call external AI models (DeepseekR1 or O1Mini) for predictions
    // 2. Process the predictions and compare with actual data
    
    // For this demo, we'll simulate AI predictions with a simple forecasting algorithm
    // This would be replaced with actual AI model calls in production
    
    // Extract data for analysis
    const fishParams = {
      phLevel: fishData.map(d => d.phLevel),
      temperatureLevel: fishData.map(d => d.temperatureLevel),
      tdsLevel: fishData.map(d => d.tdsLevel),
      turbidityLevel: fishData.map(d => d.turbidityLevel),
      ecLevel: fishData.map(d => d.ecLevel)
    };
    
    const plantParams = {
      pressureLevel: plantData.map(d => d.pressureLevel),
      temperatureLevel: plantData.map(d => d.temperatureLevel),
      humidityLevel: plantData.map(d => d.humidityLevel)
    };
    
    // Simulate AI predictions (in a real system, this would call the actual models)
    // We'll simulate by adding some variation to the actual data
    const simulatePrediction = (data, variability = 0.05) => {
      return data.map(value => {
        const variation = (Math.random() * 2 - 1) * value * variability;
        return value + variation;
      });
    };
    
    // Generate predictions for fish parameters
    const fishPredictions = {
      phLevel: simulatePrediction(fishParams.phLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      temperatureLevel: simulatePrediction(fishParams.temperatureLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      tdsLevel: simulatePrediction(fishParams.tdsLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      turbidityLevel: simulatePrediction(fishParams.turbidityLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      ecLevel: simulatePrediction(fishParams.ecLevel, model === 'DeepseekR1' ? 0.03 : 0.05)
    };
    
    // Generate predictions for plant parameters
    const plantPredictions = {
      pressureLevel: simulatePrediction(plantParams.pressureLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      temperatureLevel: simulatePrediction(plantParams.temperatureLevel, model === 'DeepseekR1' ? 0.03 : 0.05),
      humidityLevel: simulatePrediction(plantParams.humidityLevel, model === 'DeepseekR1' ? 0.03 : 0.05)
    };
    
    // Calculate accuracy for each parameter
    const fishAccuracy = {
      phLevel: calculateMAPE(fishParams.phLevel, fishPredictions.phLevel),
      temperatureLevel: calculateMAPE(fishParams.temperatureLevel, fishPredictions.temperatureLevel),
      tdsLevel: calculateMAPE(fishParams.tdsLevel, fishPredictions.tdsLevel),
      turbidityLevel: calculateMAPE(fishParams.turbidityLevel, fishPredictions.turbidityLevel),
      ecLevel: calculateMAPE(fishParams.ecLevel, fishPredictions.ecLevel)
    };
    
    const plantAccuracy = {
      pressureLevel: calculateMAPE(plantParams.pressureLevel, plantPredictions.pressureLevel),
      temperatureLevel: calculateMAPE(plantParams.temperatureLevel, plantPredictions.temperatureLevel),
      humidityLevel: calculateMAPE(plantParams.humidityLevel, plantPredictions.humidityLevel)
    };
    
    // Calculate overall accuracy
    const allAccuracies = [
      ...Object.values(fishAccuracy),
      ...Object.values(plantAccuracy)
    ];
    
    const overallAccuracy = allAccuracies.reduce((sum, accuracy) => sum + accuracy, 0) / allAccuracies.length;
    
    // Create analysis record
    const analysis = await AIAnalysis.create({
      model,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      fishAnalysis: {
        phLevel: {
          predicted: fishPredictions.phLevel,
          accuracy: fishAccuracy.phLevel
        },
        temperatureLevel: {
          predicted: fishPredictions.temperatureLevel,
          accuracy: fishAccuracy.temperatureLevel
        },
        tdsLevel: {
          predicted: fishPredictions.tdsLevel,
          accuracy: fishAccuracy.tdsLevel
        },
        turbidityLevel: {
          predicted: fishPredictions.turbidityLevel,
          accuracy: fishAccuracy.turbidityLevel
        },
        ecLevel: {
          predicted: fishPredictions.ecLevel,
          accuracy: fishAccuracy.ecLevel
        }
      },
      plantAnalysis: {
        pressureLevel: {
          predicted: plantPredictions.pressureLevel,
          accuracy: plantAccuracy.pressureLevel
        },
        temperatureLevel: {
          predicted: plantPredictions.temperatureLevel,
          accuracy: plantAccuracy.temperatureLevel
        },
        humidityLevel: {
          predicted: plantPredictions.humidityLevel,
          accuracy: plantAccuracy.humidityLevel
        }
      },
      overallAccuracy,
      comparisonResults: {
        fish: {
          actualData: fishParams,
          predictedData: fishPredictions,
          accuracy: fishAccuracy
        },
        plant: {
          actualData: plantParams,
          predictedData: plantPredictions,
          accuracy: plantAccuracy
        }
      }
    });
    
    // Notify user via email
    const user = await User.findById(req.user._id);
    const notificationEmail = user.settings.notificationEmail || user.email;
    
    await sendEmail({
      to: notificationEmail,
      subject: 'Aquaponics AI Analysis Completed',
      html: `
        <h1>🧠 AI Analysis Complete</h1>
        <p>Your aquaponics system analysis has been completed using the ${model} model.</p>
        <h2>Analysis Results</h2>
        <p><strong>Overall Accuracy:</strong> ${overallAccuracy.toFixed(2)}%</p>
        <h3>Fish Parameters Accuracy</h3>
        <ul>
          <li>pH Level: ${fishAccuracy.phLevel.toFixed(2)}%</li>
          <li>Temperature: ${fishAccuracy.temperatureLevel.toFixed(2)}%</li>
          <li>TDS Level: ${fishAccuracy.tdsLevel.toFixed(2)}%</li>
          <li>Turbidity Level: ${fishAccuracy.turbidityLevel.toFixed(2)}%</li>
          <li>EC Level: ${fishAccuracy.ecLevel.toFixed(2)}%</li>
        </ul>
        <h3>Plant Parameters Accuracy</h3>
        <ul>
          <li>Pressure Level: ${plantAccuracy.pressureLevel.toFixed(2)}%</li>
          <li>Temperature: ${plantAccuracy.temperatureLevel.toFixed(2)}%</li>
          <li>Humidity Level: ${plantAccuracy.humidityLevel.toFixed(2)}%</li>
        </ul>
        <p>For detailed results and visualizations, please check the analysis dashboard in your Aquaponics Monitoring System.</p>
      `
    });
    
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all analyses
// @route   GET /api/analysis
// @access  Private
const getAnalyses = async (req, res) => {
  try {
    const analyses = await AIAnalysis.find().sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await AIAnalysis.findById(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  runAnalysis,
  getAnalyses,
  getAnalysisById
};
