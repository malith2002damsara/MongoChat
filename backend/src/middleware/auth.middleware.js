import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies.jwt;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    console.log('Auth middleware - Token found:', !!token);
    console.log('Auth middleware - Headers:', req.headers.authorization ? 'Has Authorization header' : 'No Authorization header');
    console.log('Auth middleware - Cookies:', req.cookies.jwt ? 'Has jwt cookie' : 'No jwt cookie');

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully:', !!decoded);

    if (!decoded) {
      console.log('Auth middleware - Token decode failed');
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Add timeout to the database query
    const user = await User.findById(decoded.userId).select("-password").maxTimeMS(10000);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    
    // Handle specific MongoDB timeout errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: "Database connection timeout", 
        error: "Please try again in a moment" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Unauthorized - Token Expired" });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};
