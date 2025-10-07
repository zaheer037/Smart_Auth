const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^\+?[\d\s-()]+$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  otpHash: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  lastLoginLocation: {
    city: { type: String, default: null },
    country: { type: String, default: null },
    region: { type: String, default: null },
    timezone: { type: String, default: null }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  loginCount: {
    type: Number,
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure at least one of email or phone is provided
userSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone number is required'));
  } else {
    next();
  }
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });

// Methods
userSchema.methods.generateOTP = async function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpHash = await bcrypt.hash(otp, 12);
  this.otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  this.otpAttempts = 0;
  await this.save();
  return otp;
};

userSchema.methods.verifyOTP = async function(otp) {
  if (!this.otpHash || !this.otpExpiry) {
    return false;
  }
  
  if (new Date() > this.otpExpiry) {
    return false;
  }
  
  if (this.otpAttempts >= 3) {
    return false;
  }
  
  const isValid = await bcrypt.compare(otp, this.otpHash);
  
  if (!isValid) {
    this.otpAttempts += 1;
    await this.save();
    return false;
  }
  
  // Clear OTP data after successful verification
  this.otpHash = null;
  this.otpExpiry = null;
  this.otpAttempts = 0;
  this.verified = true;
  this.loginCount += 1;
  this.lastActiveAt = new Date();
  await this.save();
  
  return true;
};

userSchema.methods.clearOTP = async function() {
  this.otpHash = null;
  this.otpExpiry = null;
  this.otpAttempts = 0;
  await this.save();
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.otpHash;
  delete user.otpExpiry;
  delete user.otpAttempts;
  return user;
};

module.exports = mongoose.model('User', userSchema);
