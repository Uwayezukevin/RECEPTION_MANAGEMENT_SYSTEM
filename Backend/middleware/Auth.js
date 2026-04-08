// middleware/Auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        msg: 'Account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      msg: 'Invalid token' 
    });
  }
};

// For receptionist-only routes (both receptionist AND admin can access)
export const authorizeReceptionist = async (req, res, next) => {
  if (req.user.role !== 'receptionist' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      msg: 'Access denied. Receptionist or Admin privileges required.' 
    });
  }
  next();
};

// For admin-only routes (only admin can access)
export const authorizeAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      msg: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Optional: For both roles (any authenticated user)
export const authorizeAny = async (req, res, next) => {
  // This just requires authentication, which is already done
  // So we just call next() directly
  next();
};