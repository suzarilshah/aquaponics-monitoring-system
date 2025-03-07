const FishTelemetry = require('../models/fishTelemetryModel');
const PlantTelemetry = require('../models/plantTelemetryModel');

// In-memory storage for telemetry state
let telemetryPaused = false;

/**
 * Handle socket connections and events
 * @param {Object} io - Socket.io instance
 */
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Send initial telemetry state to client
    socket.emit('telemetryState', { paused: telemetryPaused });
    
    // Handle realtime data requests
    socket.on('subscribeToTelemetry', async (data) => {
      console.log(`Client ${socket.id} subscribed to telemetry`);
      
      // Send initial data
      try {
        const latestFishData = await FishTelemetry.findOne().sort({ timestamp: -1 });
        const latestPlantData = await PlantTelemetry.findOne().sort({ timestamp: -1 });
        
        if (latestFishData) {
          socket.emit('fishTelemetry', latestFishData);
        }
        
        if (latestPlantData) {
          socket.emit('plantTelemetry', latestPlantData);
        }
      } catch (error) {
        console.error('Error fetching initial telemetry data:', error);
      }
    });
    
    // Handle pause/resume telemetry
    socket.on('pauseTelemetry', (data) => {
      telemetryPaused = true;
      io.emit('telemetryState', { paused: telemetryPaused });
      console.log('Telemetry data stream paused');
    });
    
    socket.on('resumeTelemetry', (data) => {
      telemetryPaused = false;
      io.emit('telemetryState', { paused: telemetryPaused });
      console.log('Telemetry data stream resumed');
    });
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  
  // Function to send telemetry updates
  // This would be called when new telemetry data is added to the database
  const sendTelemetryUpdate = async (type, data) => {
    if (!telemetryPaused) {
      if (type === 'fish') {
        io.emit('fishTelemetry', data);
      } else if (type === 'plant') {
        io.emit('plantTelemetry', data);
      }
    }
  };
  
  return {
    sendTelemetryUpdate
  };
};

module.exports = { socketHandler };
