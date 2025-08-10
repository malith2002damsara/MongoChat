import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? [
          "https://chat-app-desktop-frontend.vercel.app",
          "http://localhost:5173"
        ]
      : true, // Allow all origins in development
    credentials: false, // Disable credentials for Vercel compatibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// API status route - shows server is working
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 API is working perfectly!",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// Handle preflight requests for Socket.IO
app.options("/socket.io/*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "false");
  res.sendStatus(200);
});

// Test endpoint for CORS
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "CORS test successful!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get("/api/db-test", async (req, res) => {
  try {
    const User = (await import("./models/user.model.js")).default;
    const userCount = await User.countDocuments();
    res.json({ 
      message: "Database connection successful!",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "✅ Server is healthy and running!",
    status: "healthy", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    // Skip API routes from catch-all handler
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: "API route not found", 
        path: req.path 
      });
    }
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, async () => {
  console.log(`🌟 Server is running on PORT: ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("🔄 Connecting to database...");
  
  try {
    await connectDB();
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    // Don't exit the process in production
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
});