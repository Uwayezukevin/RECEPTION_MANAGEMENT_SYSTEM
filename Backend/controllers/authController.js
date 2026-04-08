// controllers/authController.js - Add admin registration
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register User (Receptionist or Admin)
export const RegisterUser = async (req, res) => {
  try {
    const { fullName, email, password, role, adminSecret } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "User already exists with this email"
      });
    }

    // Validate role
    let userRole = 'receptionist';
    
    if (role === 'admin') {
      // Verify admin secret key (for security)
      const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin-secret-key-2026';
      if (adminSecret !== ADMIN_SECRET_KEY) {
        return res.status(403).json({
          success: false,
          msg: "Invalid admin secret key"
        });
      }
      userRole = 'admin';
    }

    // Create user
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      role: userRole,
      isActive: true
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      msg: `${userRole === 'admin' ? 'Admin' : 'Receptionist'} registered successfully`,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// Login User
export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Please provide email and password"
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials"
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        msg: "Account is deactivated. Please contact administrator."
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials"
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      msg: `Welcome back, ${user.fullName}!`,
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

// Get Current User
export const GetCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("Error getting user:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// Get All Users (Admin only)
export const GetAllUsers = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only."
      });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// Update User Status (Admin only)
export const UpdateUserStatus = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only."
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: "You cannot deactivate your own account"
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      msg: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// Delete User (Admin only)
export const DeleteUser = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: "Access denied. Admin only."
      });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: "You cannot delete your own account"
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    res.json({
      success: true,
      msg: `User ${user.fullName} deleted successfully`
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};