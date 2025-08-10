import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
//malith

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    console.log("Signup attempt for:", { fullName, email });
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Add timeout to the database query
    const user = await User.findOne({ email }).maxTimeMS(10000);

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      console.log("Generating token for new user...");
      const token = generateToken(newUser._id, res);
      await newUser.save();
      console.log("User saved successfully");

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        token: token, // Always return token for frontend localStorage
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    console.log("Full error:", error);
    
    // Handle specific MongoDB timeout errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection timeout", 
        error: "Please try again in a moment" 
      });
    }
    
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Login attempt for email:", email);
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Add timeout to the database query
    const user = await User.findOne({ email }).maxTimeMS(10000);
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log("Password correct:", isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Generating token...");
    const token = generateToken(user._id, res);
    console.log("Token generated successfully");

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token: token, // Always return token for frontend localStorage
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    console.log("Full error:", error);
    
    // Handle specific MongoDB timeout errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(500).json({ 
        message: "Database connection timeout", 
        error: "Please try again in a moment" 
      });
    }
    
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, email, currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get the current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    // Handle profile picture update
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    // Handle name update
    if (fullName && fullName.trim() !== "") {
      updateData.fullName = fullName.trim();
    }

    // Handle email update
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updateData.email = email;
    }

    // Handle password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set new password" });
      }

      const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // Update user if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
