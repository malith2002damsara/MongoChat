import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" 
      ? [
          "https://chat-app-desktop-frontend.vercel.app",
          "http://localhost:5173"
        ]
      : ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ["websocket", "polling"],
  allowEIO3: true, // Enable compatibility with older clients
  pingTimeout: 30000, // Reduce ping timeout for faster detection
  pingInterval: 10000, // More frequent pings for better real-time performance
  upgradeTimeout: 5000, // Faster upgrade timeout
  maxHttpBufferSize: 1e6, // 1MB limit for faster message processing
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
    
    // Emit user came online
    socket.broadcast.emit("userOnline", userId);
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle real-time message events
  socket.on("sendMessage", (messageData) => {
    const receiverSocketId = getReceiverSocketId(messageData.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageData);
    }
  });

  // Handle typing indicators for better UX
  socket.on("typing", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId: userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle message deletion
  socket.on("deleteMessage", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", data);
    }
  });

  // Handle clear all messages
  socket.on("clearMessages", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagesCleared", data);
    }
  });

  // Handle user activity/presence
  socket.on("updatePresence", (status) => {
    if (userId) {
      socket.broadcast.emit("userPresenceUpdate", {
        userId,
        status, // online, away, busy, offline
        lastSeen: new Date()
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    if (userId) {
      // Emit user went offline
      socket.broadcast.emit("userOffline", {
        userId,
        lastSeen: new Date()
      });
      
      delete userSocketMap[userId];
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.log("Socket error:", error);
  });
});

export { io, app, server };
