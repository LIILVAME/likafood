const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  code: {
    type: String,
    required: true,
    length: 6
  },
  
  type: {
    type: String,
    enum: ['registration', 'login', 'password_reset'],
    required: true
  },
  
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  
  isUsed: {
    type: Boolean,
    default: false
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
otpSchema.index({ phoneNumber: 1, type: 1 });
otpSchema.index({ code: 1 });
otpSchema.index({ createdAt: -1 });

// Methods
otpSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

otpSchema.methods.isValid = function() {
  return !this.isUsed && !this.isExpired() && this.attempts < 3;
};

otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Static methods
otpSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

otpSchema.statics.createOtp = function(phoneNumber, type, expirationMinutes = 10) {
  const code = this.generateCode();
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
  
  return this.create({
    phoneNumber,
    code,
    type,
    expiresAt
  });
};

otpSchema.statics.findValidOtp = function(phoneNumber, code, type) {
  return this.findOne({
    phoneNumber,
    code,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  });
};

otpSchema.statics.findLatestOtp = function(phoneNumber, type) {
  return this.findOne({
    phoneNumber,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

otpSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true },
      { attempts: { $gte: 3 } }
    ]
  });
};

otpSchema.statics.verifyOtp = async function(phoneNumber, code, type = 'login') {
  try {
    // Allow generic test OTP 123456 in development/test environment
    if (code === '123456' && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      console.log('🧪 Test OTP 123456 accepted for development/test environment');
      return true;
    }
    
    const otp = await this.findValidOtp(phoneNumber, code, type);
    if (!otp) {
      return false;
    }
    
    // Mark OTP as used
    await otp.markAsUsed();
    return true;
  } catch (error) {
    return false;
  }
};

// Pre-save middleware
otpSchema.pre('save', function(next) {
  // Ensure code is always 6 digits
  if (this.code && this.code.length !== 6) {
    return next(new Error('OTP code must be exactly 6 digits'));
  }
  next();
});

module.exports = mongoose.model('Otp', otpSchema);