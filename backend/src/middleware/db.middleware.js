import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";

export const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if we have an active connection
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    // If not connected, try to connect
    if (mongoose.connection.readyState === 0) {
      console.log("Database not connected, attempting to reconnect...");
      await connectDB();
    }
    
    // Wait for connection to be ready
    let attempts = 0;
    const maxAttempts = 10;
    
    while (mongoose.connection.readyState !== 1 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: "Database connection unavailable", 
        error: "Please try again later" 
      });
    }
    
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    res.status(503).json({ 
      message: "Database connection failed", 
      error: "Please try again later" 
    });
  }
};
