const express = require('express');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { sendOTP } = require('../utils/otpService');
const { getLocationFromIP, analyzLocationChange } = require('../utils/geoLocation');
const { getClientIP, getUserAgent } = require('../middleware/auth');
const { getEnhancedClientIP, getEnhancedLocation } = require('../utils/ipService');

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Send OTP to email or phone
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    // Determine auth method and identifier
    const authMethod = email ? 'email' : 'phone';
    const identifier = email || phone;

    // Get client info
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = getLocationFromIP(clientIP);

    // Find or create user
    let user = await User.findOne(
      email ? { email } : { phone }
    );

    if (!user) {
      // Create new user
      user = new User(email ? { email } : { phone });
      await user.save();
      console.log(`👤 New user created: ${identifier}`);
    }

    // Check if user has pending OTP
    if (user.otpExpiry && new Date() < user.otpExpiry) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new OTP',
        timeRemaining: Math.ceil((user.otpExpiry - new Date()) / 1000)
      });
    }

    // Generate and save OTP
    const otp = await user.generateOTP();

    // Send OTP
    const otpSent = await sendOTP(identifier, authMethod, otp, location);

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // Log the attempt (not in login history yet, just for monitoring)
    console.log(`🔐 OTP sent to ${identifier} from IP: ${clientIP} (${location.city}, ${location.country})`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${authMethod === 'email' ? 'your email' : 'your phone'}`,
      expiresIn: 120 // 2 minutes
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    // Find user
    const user = await User.findOne(
      email ? { email } : { phone }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    const isValidOTP = await user.verifyOTP(otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Get client info with enhanced IP detection
    const clientIP = await getEnhancedClientIP(req);
    const userAgent = getUserAgent(req);
    const currentLocation = await getEnhancedLocation(clientIP);
    
    console.log(`🌐 Login from IP: ${clientIP}, Location: ${currentLocation.city}, ${currentLocation.country}`);

    // Analyze login for suspicious activity
    let loginStatus = 'safe';
    let riskScore = 0;
    let riskFactors = [];

    // Check for location-based anomalies
    if (user.lastLoginLocation && user.lastActiveAt) {
      const timeDiff = (new Date() - user.lastActiveAt) / (1000 * 60 * 60); // hours
      const locationAnalysis = analyzLocationChange(
        currentLocation, 
        user.lastLoginLocation, 
        timeDiff
      );

      if (locationAnalysis.suspicious) {
        loginStatus = 'suspicious';
        riskScore += 50;
        riskFactors.push({
          factor: 'location_change',
          score: 50,
          description: locationAnalysis.reason
        });
      }
    }

    // Check for new IP
    if (user.lastLoginIP && user.lastLoginIP !== clientIP) {
      riskScore += 20;
      riskFactors.push({
        factor: 'new_ip',
        score: 20,
        description: 'Login from new IP address'
      });
    }

    // Update user location and IP
    user.lastLoginIP = clientIP;
    user.lastLoginLocation = currentLocation;
    await user.save();

    // Create login history record
    const loginRecord = new LoginHistory({
      userId: user._id,
      ip: clientIP,
      userAgent,
      location: currentLocation,
      status: loginStatus,
      riskScore,
      riskFactors,
      authMethod: email ? 'email' : 'phone',
      success: true
    });

    await loginRecord.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    console.log(`✅ User logged in: ${email || phone} from ${clientIP} (${currentLocation.city}, ${currentLocation.country}) - Status: ${loginStatus}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        loginCount: user.loginCount
      },
      loginInfo: {
        location: currentLocation,
        status: loginStatus,
        riskScore,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP (alias for send-otp with additional checks)
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    // Find user
    const user = await User.findOne(
      email ? { email } : { phone }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No pending OTP request found'
      });
    }

    // Clear existing OTP and proceed with new one
    await user.clearOTP();

    // Forward to send-otp logic
    req.body = { email, phone };
    return router.handle(req, res);

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
