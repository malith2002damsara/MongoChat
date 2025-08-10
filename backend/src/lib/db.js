import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Optimize for production/serverless environments with faster settings
    const options = {
      maxPoolSize: 15, // Increase pool size for better concurrency
      serverSelectionTimeoutMS: 3000, // Faster server selection
      socketTimeoutMS: 30000, // Reduce socket timeout for faster responses
      bufferCommands: false, // Disable mongoose buffering
      connectTimeoutMS: 5000, // Faster initial connection
      family: 4, // Use IPv4, skip trying IPv6
      heartbeatFrequencyMS: 10000, // More frequent heartbeats
      retryWrites: true, // Enable retry writes for better reliability
      w: 'majority', // Write concern for faster writes
      readPreference: 'primaryPreferred', // Prefer primary for faster reads
    };

    if (mongoose.connections[0].readyState) {
      console.log("MongoDB already connected");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
    throw error;
  }
};
