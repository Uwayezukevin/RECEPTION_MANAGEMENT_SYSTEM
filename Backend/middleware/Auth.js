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

// For receptionist-only routes
export const authorizeReceptionist = async (req, res, next) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ 
      success: false,
      msg: 'Access denied. Receptionist privileges required.' 
    });
  }
  next();
};