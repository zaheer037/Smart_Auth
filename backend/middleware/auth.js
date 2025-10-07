const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-otpHash -otpExpiry -otpAttempts');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

/**
 * Extract IP address from request
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
const getClientIP = (req) => {
  // Try to get real IP from various headers
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.headers['cf-connecting-ip'] || // Cloudflare
           req.headers['x-client-ip'] ||
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip;

  // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Convert IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // For development, try to get a more realistic IP
  if (ip === '127.0.0.1' || ip === '::1') {
    // In development, you can use a service to get your public IP
    // For now, we'll use a placeholder that represents "local development"
    return 'dev-local';
  }

  return ip || '127.0.0.1';
};

/**
 * Extract user agent from request
 * @param {object} req - Express request object
 * @returns {string} User agent
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  getClientIP,
  getUserAgent
};
