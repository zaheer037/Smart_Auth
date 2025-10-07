const express = require('express');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/user/profile
 * Get user profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otpHash -otpExpiry -otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/login-history
 * Get user's login history
 */
router.get('/login-history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-userId');

    const total = await LoginHistory.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/stats
 * Get user statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get login statistics
    const loginStats = await LoginHistory.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent login locations
    const recentLocations = await LoginHistory.aggregate([
      { $match: { userId: userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $group: {
          _id: {
            city: '$location.city',
            country: '$location.country'
          },
          count: { $sum: 1 },
          lastSeen: { $max: '$createdAt' }
        }
      },
      { $sort: { lastSeen: -1 } }
    ]);

    // Get login frequency by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const loginFrequency = await LoginHistory.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format statistics
    const stats = {
      totalLogins: loginStats.reduce((sum, stat) => sum + stat.count, 0),
      safeLogins: loginStats.find(s => s._id === 'safe')?.count || 0,
      suspiciousLogins: loginStats.find(s => s._id === 'suspicious')?.count || 0,
      recentLocations: recentLocations.map(loc => ({
        location: `${loc._id.city}, ${loc._id.country}`,
        count: loc.count,
        lastSeen: loc.lastSeen
      })),
      loginFrequency: loginFrequency.map(freq => ({
        date: freq._id,
        count: freq.count
      }))
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userId = req.user._id;

    // Validate that at least one identifier is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'At least one of email or phone is required'
      });
    }

    // Check if email/phone is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    if (phone) {
      const existingUser = await User.findOne({ 
        phone, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already registered'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        email: email || undefined,
        phone: phone || undefined,
        verified: false // Reset verification if contact info changes
      },
      { new: true, runValidators: true }
    ).select('-otpHash -otpExpiry -otpAttempts');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user's login history
    await LoginHistory.deleteMany({ userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
