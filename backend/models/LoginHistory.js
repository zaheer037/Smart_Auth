const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  location: {
    city: { type: String, default: null },
    country: { type: String, default: null },
    region: { type: String, default: null },
    timezone: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  status: {
    type: String,
    enum: ['safe', 'suspicious', 'blocked'],
    default: 'safe'
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskFactors: [{
    factor: String,
    score: Number,
    description: String
  }],
  authMethod: {
    type: String,
    enum: ['email', 'phone'],
    required: true
  },
  deviceFingerprint: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  },
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
loginHistorySchema.index({ userId: 1, createdAt: -1 });
loginHistorySchema.index({ ip: 1 });
loginHistorySchema.index({ status: 1 });
loginHistorySchema.index({ createdAt: -1 });

// Static methods
loginHistorySchema.statics.getRecentLoginsByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email phone');
};

loginHistorySchema.statics.getSuspiciousLogins = function(timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  return this.find({
    status: 'suspicious',
    createdAt: { $gte: since }
  }).populate('userId', 'email phone');
};

loginHistorySchema.statics.getLoginsByIP = function(ip, limit = 50) {
  return this.find({ ip })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email phone');
};

loginHistorySchema.statics.getUserLoginStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        lastLogin: { $max: '$createdAt' }
      }
    }
  ]);
};

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
