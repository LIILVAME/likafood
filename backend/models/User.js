const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic phone number validation (international format)
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  
  // Business Information
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  ownerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  
  // Business Details
  businessType: {
    type: String,
    enum: ['restaurant', 'cafe', 'bakery', 'food_truck', 'catering', 'other'],
    default: 'restaurant'
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'CI' } // Côte d'Ivoire
  },
  
  // Authentication
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  lastOtpSent: {
    type: Date
  },
  
  otpAttempts: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isOnboarded: {
    type: Boolean,
    default: false
  },
  
  // Business Hours
  businessHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  
  // Settings
  settings: {
    currency: { type: String, default: 'XOF' }, // West African CFA franc
    language: { type: String, default: 'fr' },
    timezone: { type: String, default: 'Africa/Abidjan' },
    notifications: {
      orders: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      system: { type: Boolean, default: true }
    }
  },
  
  // Metadata
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
// Index removed - phoneNumber already has unique: true which creates an index
userSchema.index({ businessName: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

// Methods
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.otpAttempts;
  delete userObject.lastOtpSent;
  return userObject;
};

userSchema.methods.canReceiveOtp = function() {
  const now = new Date();
  const lastOtpTime = this.lastOtpSent;
  
  // Allow OTP if never sent before
  if (!lastOtpTime) return true;
  
  // Check if 1 minute has passed since last OTP
  const timeDiff = now - lastOtpTime;
  const oneMinute = 60 * 1000;
  
  return timeDiff >= oneMinute;
};

userSchema.methods.incrementOtpAttempts = function() {
  this.otpAttempts += 1;
  this.lastOtpSent = new Date();
  return this.save();
};

userSchema.methods.resetOtpAttempts = function() {
  this.otpAttempts = 0;
  this.lastOtpSent = undefined;
  return this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByPhoneNumber = function(phoneNumber) {
  return this.findOne({ phoneNumber });
};

userSchema.statics.createUser = function(userData) {
  return this.create({
    ...userData,
    isPhoneVerified: false,
    isOnboarded: false
  });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);