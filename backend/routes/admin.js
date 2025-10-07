const express = require('express');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ verified: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    // Login statistics
    const totalLogins = await LoginHistory.countDocuments();
    const loginsToday = await LoginHistory.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    const suspiciousLogins = await LoginHistory.countDocuments({
      status: 'suspicious'
    });
    const suspiciousLoginsToday = await LoginHistory.countDocuments({
      status: 'suspicious',
      createdAt: { $gte: last24Hours }
    });

    // Login trends (last 7 days)
    const loginTrends = await LoginHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          safe: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'safe'] }, '$count', 0]
            }
          },
          suspicious: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'suspicious'] }, '$count', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top locations
    const topLocations = await LoginHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            country: '$location.country'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          location: {
            $concat: ['$_id.city', ', ', '$_id.country']
          },
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          newToday: newUsersToday
        },
        logins: {
          total: totalLogins,
          today: loginsToday,
          suspicious: suspiciousLogins,
          suspiciousToday: suspiciousLoginsToday
        },
        trends: {
          loginTrends,
          topLocations
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      verified = 'all'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Verified filter
    if (verified !== 'all') {
      query.verified = verified === 'verified';
    }

    const users = await User.find(query)
      .select('-otpHash -otpExpiry -otpAttempts')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get login counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const loginCount = await LoginHistory.countDocuments({ userId: user._id });
        const suspiciousCount = await LoginHistory.countDocuments({
          userId: user._id,
          status: 'suspicious'
        });
        
        return {
          ...user.toObject(),
          stats: {
            totalLogins: loginCount,
            suspiciousLogins: suspiciousCount
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/logins
 * Get all login history with pagination and filtering
 */
router.get('/logins', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = 'all',
      search = '',
      days = 30
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Date filter
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    query.createdAt = { $gte: daysAgo };

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Get logins with user information
    const logins = await LoginHistory.find(query)
      .populate('userId', 'email phone role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter after population
    let filteredLogins = logins;
    if (search) {
      filteredLogins = logins.filter(login => {
        const user = login.userId;
        const searchLower = search.toLowerCase();
        
        return (
          (user?.email && user.email.toLowerCase().includes(searchLower)) ||
          (user?.phone && user.phone.includes(search)) ||
          (login.ip && login.ip.includes(search)) ||
          (login.location?.city && login.location.city.toLowerCase().includes(searchLower)) ||
          (login.location?.country && login.location.country.toLowerCase().includes(searchLower))
        );
      });
    }

    const total = await LoginHistory.countDocuments(query);

    // Format response
    const formattedLogins = filteredLogins.map(login => ({
      _id: login._id,
      user: login.userId,
      ip: login.ip,
      location: login.location,
      status: login.status,
      riskScore: login.riskScore,
      riskFactors: login.riskFactors,
      authMethod: login.authMethod,
      userAgent: login.userAgent,
      time: login.createdAt,
      success: login.success
    }));

    res.json({
      success: true,
      logins: formattedLogins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get logins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/user/:id
 * Get detailed user information
 */
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-otpHash -otpExpiry -otpAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's login history
    const loginHistory = await LoginHistory.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get user statistics
    const stats = await LoginHistory.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStats = {
      totalLogins: stats.reduce((sum, stat) => sum + stat.count, 0),
      safeLogins: stats.find(s => s._id === 'safe')?.count || 0,
      suspiciousLogins: stats.find(s => s._id === 'suspicious')?.count || 0
    };

    res.json({
      success: true,
      user,
      loginHistory,
      stats: userStats
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/user/:id/status
 * Update user status (activate/deactivate)
 */
router.put('/user/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-otpHash -otpExpiry -otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/admin/user/:id
 * Delete user account (admin only)
 */
router.delete('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow admin to delete themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's login history
    await LoginHistory.deleteMany({ userId: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
