const mongoose = require('mongoose');
const { jest } = require('@jest/globals');

// Setup before all tests
beforeAll(async () => {
  // Connect to the test database (URI set in globalSetup)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(global.__MONGO_URI__ || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  console.log('🔗 Connected to test database');
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('🔌 Disconnected from test database');
});

// Mock external services
jest.mock('../services/smsService', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true, sid: 'test-sid' }),
  validatePhoneNumber: jest.fn().mockReturnValue(true)
}));

// Mock Redis if used
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn()
  }))
}));

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      phoneNumber: '+1234567890',
      businessName: 'Test Restaurant',
      ownerName: 'Test Owner',
      isVerified: true,
      ...userData
    };
    return await User.create(defaultUser);
  },
  
  // Helper to create test dish
  createTestDish: async (dishData = {}) => {
    const Dish = require('../models/Dish');
    const defaultDish = {
      name: 'Test Dish',
      description: 'Test Description',
      price: 10.99,
      category: 'Test Category',
      isAvailable: true,
      ...dishData
    };
    return await Dish.create(defaultDish);
  },
  
  // Helper to generate JWT token
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );
  }
};