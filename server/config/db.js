const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    // Check if we're in development mode using CSV data
    if (process.env.NODE_ENV === 'development' && process.env.USE_CSV_DATA === 'true') {
      console.log('Development mode: Using CSV data instead of MongoDB');
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Continuing without database connection...');
    // Don't exit the process, allow the app to run without MongoDB
  }
};

module.exports = { connectToDatabase };
