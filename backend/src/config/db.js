const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options and add recommended ones
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Log more detailed error information
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to MongoDB. Please check:');
      console.error('1. MongoDB is running');
      console.error('2. Connection string is correct');
      console.error('3. Network access is allowed');
      console.error('4. Authentication credentials are correct');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
