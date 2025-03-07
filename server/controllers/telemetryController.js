const FishTelemetry = require('../models/fishTelemetryModel');
const PlantTelemetry = require('../models/plantTelemetryModel');
const User = require('../models/userModel');
const { sendEmail } = require('../services/emailService');
const csvDataService = require('../services/csvDataService');

// Define threshold values for alerting
const THRESHOLDS = {
  fish: {
    phLevel: { min: 6.5, max: 8.5 },
    temperatureLevel: { min: 20, max: 30 },
    tdsLevel: { min: 100, max: 500 },
    turbidityLevel: { min: 0, max: 25 },
    ecLevel: { min: 0.5, max: 3.0 }
  },
  plant: {
    pressureLevel: { min: 0.5, max: 5.0 },
    temperatureLevel: { min: 18, max: 28 },
    humidityLevel: { min: 50, max: 85 }
  }
};

// @desc    Get latest fish telemetry data
// @route   GET /api/telemetry/fish/latest
// @access  Private
const getLatestFishTelemetry = async (req, res) => {
  try {
    // Try to get from MongoDB first
    const latestData = await FishTelemetry.findOne().sort({ timestamp: -1 });
    
    if (latestData) {
      return res.json(latestData);
    }
    
    // If no MongoDB data, use CSV data
    await csvDataService.loadAllData();
    const currentData = csvDataService.getCurrentTelemetry();
    
    if (!currentData || !currentData.fish) {
      return res.status(404).json({ message: 'No telemetry data found' });
    }
    
    res.json(currentData.fish);
  } catch (error) {
    console.error('Error fetching latest fish telemetry:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest plant telemetry data
// @route   GET /api/telemetry/plant/latest
// @access  Private
const getLatestPlantTelemetry = async (req, res) => {
  try {
    // Try to get from MongoDB first
    const latestData = await PlantTelemetry.findOne().sort({ timestamp: -1 });
    
    if (latestData) {
      return res.json(latestData);
    }
    
    // If no MongoDB data, use CSV data
    await csvDataService.loadAllData();
    const currentData = csvDataService.getCurrentTelemetry();
    
    if (!currentData || !currentData.plant) {
      return res.status(404).json({ message: 'No telemetry data found' });
    }
    
    res.json(currentData.plant);
  } catch (error) {
    console.error('Error fetching latest plant telemetry:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fish telemetry data by date range
// @route   GET /api/telemetry/fish
// @access  Private
const getFishTelemetryByRange = async (req, res) => {
  try {
    const { startDate, endDate, isValidation, granularity } = req.query;
    const useValidation = isValidation === 'true';
    const timeGranularity = granularity || '10min';
    
    // Try MongoDB first if no validation data is requested
    if (!useValidation) {
      const query = {};
      
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      const mongoData = await FishTelemetry.find(query).sort({ timestamp: 1 });
      
      if (mongoData && mongoData.length > 0) {
        return res.json(mongoData);
      }
    }
    
    // If no MongoDB data or validation data requested, use CSV data
    await csvDataService.loadAllData();
    const data = csvDataService.getFishData(
      useValidation,
      startDate,
      endDate,
      timeGranularity
    );
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching fish telemetry by range:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get plant telemetry data by date range
// @route   GET /api/telemetry/plant
// @access  Private
const getPlantTelemetryByRange = async (req, res) => {
  try {
    const { startDate, endDate, isValidation, granularity } = req.query;
    const useValidation = isValidation === 'true';
    const timeGranularity = granularity || '10min';
    
    // Try MongoDB first if no validation data is requested
    if (!useValidation) {
      const query = {};
      
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      const mongoData = await PlantTelemetry.find(query).sort({ timestamp: 1 });
      
      if (mongoData && mongoData.length > 0) {
        return res.json(mongoData);
      }
    }
    
    // If no MongoDB data or validation data requested, use CSV data
    await csvDataService.loadAllData();
    const data = csvDataService.getPlantData(
      useValidation,
      startDate,
      endDate,
      timeGranularity
    );
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching plant telemetry by range:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new fish telemetry data
// @route   POST /api/telemetry/fish
// @access  Private (in production, this would likely be restricted to IoT devices)
const addFishTelemetry = async (req, res) => {
  try {
    const { phLevel, temperatureLevel, tdsLevel, turbidityLevel, ecLevel } = req.body;
    
    const telemetry = await FishTelemetry.create({
      phLevel,
      temperatureLevel,
      tdsLevel,
      turbidityLevel,
      ecLevel
    });
    
    // Check if any parameter is outside of threshold values
    const alerts = [];
    if (phLevel < THRESHOLDS.fish.phLevel.min || phLevel > THRESHOLDS.fish.phLevel.max) {
      alerts.push(`pH level (${phLevel}) is outside recommended range (${THRESHOLDS.fish.phLevel.min}-${THRESHOLDS.fish.phLevel.max})`);
    }
    if (temperatureLevel < THRESHOLDS.fish.temperatureLevel.min || temperatureLevel > THRESHOLDS.fish.temperatureLevel.max) {
      alerts.push(`Temperature (${temperatureLevel}°C) is outside recommended range (${THRESHOLDS.fish.temperatureLevel.min}-${THRESHOLDS.fish.temperatureLevel.max}°C)`);
    }
    if (tdsLevel < THRESHOLDS.fish.tdsLevel.min || tdsLevel > THRESHOLDS.fish.tdsLevel.max) {
      alerts.push(`TDS level (${tdsLevel} ppm) is outside recommended range (${THRESHOLDS.fish.tdsLevel.min}-${THRESHOLDS.fish.tdsLevel.max} ppm)`);
    }
    if (turbidityLevel < THRESHOLDS.fish.turbidityLevel.min || turbidityLevel > THRESHOLDS.fish.turbidityLevel.max) {
      alerts.push(`Turbidity level (${turbidityLevel} NTU) is outside recommended range (${THRESHOLDS.fish.turbidityLevel.min}-${THRESHOLDS.fish.turbidityLevel.max} NTU)`);
    }
    if (ecLevel < THRESHOLDS.fish.ecLevel.min || ecLevel > THRESHOLDS.fish.ecLevel.max) {
      alerts.push(`EC level (${ecLevel} mS/cm) is outside recommended range (${THRESHOLDS.fish.ecLevel.min}-${THRESHOLDS.fish.ecLevel.max} mS/cm)`);
    }
    
    // If there are alerts, send email to all users
    if (alerts.length > 0) {
      const users = await User.find();
      
      for (const user of users) {
        const notificationEmail = user.settings.notificationEmail || user.email;
        
        await sendEmail({
          to: notificationEmail,
          subject: 'Aquaponics System Alert - Fish Tank',
          html: `
            <h1>⚠️ Fish Tank Alert</h1>
            <p>The following parameters in your fish tank are outside of recommended ranges:</p>
            <ul>
              ${alerts.map(alert => `<li>${alert}</li>`).join('')}
            </ul>
            <p>Please check your system as soon as possible.</p>
          `
        });
      }
    }
    
    res.status(201).json(telemetry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new plant telemetry data
// @route   POST /api/telemetry/plant
// @access  Private (in production, this would likely be restricted to IoT devices)
const addPlantTelemetry = async (req, res) => {
  try {
    const { pressureLevel, temperatureLevel, humidityLevel } = req.body;
    
    const telemetry = await PlantTelemetry.create({
      pressureLevel,
      temperatureLevel,
      humidityLevel
    });
    
    // Check if any parameter is outside of threshold values
    const alerts = [];
    if (pressureLevel < THRESHOLDS.plant.pressureLevel.min || pressureLevel > THRESHOLDS.plant.pressureLevel.max) {
      alerts.push(`Pressure level (${pressureLevel} kPa) is outside recommended range (${THRESHOLDS.plant.pressureLevel.min}-${THRESHOLDS.plant.pressureLevel.max} kPa)`);
    }
    if (temperatureLevel < THRESHOLDS.plant.temperatureLevel.min || temperatureLevel > THRESHOLDS.plant.temperatureLevel.max) {
      alerts.push(`Temperature (${temperatureLevel}°C) is outside recommended range (${THRESHOLDS.plant.temperatureLevel.min}-${THRESHOLDS.plant.temperatureLevel.max}°C)`);
    }
    if (humidityLevel < THRESHOLDS.plant.humidityLevel.min || humidityLevel > THRESHOLDS.plant.humidityLevel.max) {
      alerts.push(`Humidity level (${humidityLevel}%) is outside recommended range (${THRESHOLDS.plant.humidityLevel.min}-${THRESHOLDS.plant.humidityLevel.max}%)`);
    }
    
    // If there are alerts, send email to all users
    if (alerts.length > 0) {
      const users = await User.find();
      
      for (const user of users) {
        const notificationEmail = user.settings.notificationEmail || user.email;
        
        await sendEmail({
          to: notificationEmail,
          subject: 'Aquaponics System Alert - Plant Tray',
          html: `
            <h1>⚠️ Plant Tray Alert</h1>
            <p>The following parameters in your plant tray are outside of recommended ranges:</p>
            <ul>
              ${alerts.map(alert => `<li>${alert}</li>`).join('')}
            </ul>
            <p>Please check your system as soon as possible.</p>
          `
        });
      }
    }
    
    res.status(201).json(telemetry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pause telemetry data collection
// @route   POST /api/telemetry/pause
// @access  Private
const pauseTelemetry = async (req, res) => {
  try {
    // In a real system, this would communicate with the IoT hub
    // For this demo, we'll just simulate by sending an email
    const user = await User.findById(req.user._id);
    const notificationEmail = user.settings.notificationEmail || user.email;
    
    // Send notification email
    await sendEmail({
      to: notificationEmail,
      subject: 'Aquaponics Telemetry Paused',
      html: `
        <h1>⏸️ Telemetry Data Collection Paused</h1>
        <p>The telemetry data collection for your aquaponics system has been paused.</p>
        <p>Please note that no data will be collected while the system is paused.</p>
        <p>Resume data collection as soon as possible to ensure proper monitoring of your system.</p>
      `
    });
    
    res.status(200).json({ message: 'Telemetry paused successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current telemetry data (real-time cycling)
// @route   GET /api/telemetry/current
// @access  Private
const getCurrentTelemetry = async (req, res) => {
  try {
    await csvDataService.loadAllData();
    const currentData = csvDataService.getCurrentTelemetry();
    
    if (!currentData) {
      return res.status(404).json({ 
        success: false,
        message: 'No current telemetry data available' 
      });
    }
    
    return res.status(200).json({
      success: true,
      data: currentData
    });
  } catch (error) {
    console.error('Error fetching current telemetry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching current telemetry data',
      error: error.message
    });
  }
};

// @desc    Get fish telemetry data (initial or validate dataset)
// @route   GET /api/telemetry/fish/data
// @access  Private
const getFishTelemetryData = async (req, res) => {
  try {
    console.log('Received request for fish telemetry data');
    const { dataset } = req.query;
    console.log('Dataset requested:', dataset);
    const isValidation = dataset === 'validate';
    
    console.log('Loading CSV data...');
    await csvDataService.loadAllData();
    
    const data = isValidation ? csvDataService.fishValidateData : csvDataService.fishInitialData;
    console.log('Fish data loaded, records:', data ? data.length : 0);
    
    if (!data || data.length === 0) {
      console.log('No fish telemetry data found');
      return res.status(404).json({ message: 'No fish telemetry data found' });
    }
    
    console.log('Sending fish telemetry data to client');
    res.json(data);
  } catch (error) {
    console.error('Error fetching fish telemetry data:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get plant telemetry data (initial or validate dataset)
// @route   GET /api/telemetry/plant/data
// @access  Private
const getPlantTelemetryData = async (req, res) => {
  try {
    console.log('Received request for plant telemetry data');
    const { dataset } = req.query;
    console.log('Dataset requested:', dataset);
    const isValidation = dataset === 'validate';
    
    console.log('Loading CSV data...');
    await csvDataService.loadAllData();
    
    const data = isValidation ? csvDataService.plantValidateData : csvDataService.plantInitialData;
    console.log('Plant data loaded, records:', data ? data.length : 0);
    
    if (!data || data.length === 0) {
      console.log('No plant telemetry data found');
      return res.status(404).json({ message: 'No plant telemetry data found' });
    }
    
    console.log('Sending plant telemetry data to client');
    res.json(data);
  } catch (error) {
    console.error('Error fetching plant telemetry data:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
