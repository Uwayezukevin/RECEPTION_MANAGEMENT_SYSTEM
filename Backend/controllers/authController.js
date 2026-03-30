// controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const RegisterUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    console.log("Registration attempt for:", email);

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "All fields are required" 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        msg: "Email already in use" 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: "Password must be at least 6 characters long"
      });
    }

    // Create user
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save middleware
      role: 'receptionist',
      isActive: true
    });

    console.log("Saving user...");
    const savedUser = await user.save();
    console.log("User saved successfully:", savedUser.email);

    // Generate token
    const token = generateToken(savedUser);

    res.status(201).json({
      success: true,
      msg: "Receptionist account created successfully",
      token,
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        msg: "Email already in use" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: err.message || "Error creating account"
    });
  }
};

export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        msg: "Please provide email and password" 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: "Invalid credentials" 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        msg: "Account is deactivated. Please contact administrator." 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        msg: "Invalid credentials" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetAllReceptionists = async (req, res) => {
  try {
    const receptionists = await User.find({ role: 'receptionist' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: receptionists.length,
      receptionists
    });
  } catch (err) {
    console.error("Error fetching receptionists:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const UpdateReceptionistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const receptionist = await User.findById(id);
    if (!receptionist) {
      return res.status(404).json({
        success: false,
        msg: "Receptionist not found"
      });
    }
    
    receptionist.isActive = isActive;
    await receptionist.save();
    
    res.json({
      success: true,
      msg: `Receptionist ${isActive ? 'activated' : 'deactivated'} successfully`,
      receptionist
    });
  } catch (err) {
    console.error("Error updating receptionist:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};