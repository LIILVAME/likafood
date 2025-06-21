const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Otp = require('../../models/Otp');
const authRoutes = require('../../routes/auth');
const { sendOTP } = require('../../services/smsService');
require('../setup');

// Mock SMS service
jest.mock('../../services/smsService');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Reset mocks before each test
beforeEach(() => {
  if (sendOTP.mockClear) {
    sendOTP.mockClear();
  }
});

describe('Auth Routes - Functional Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        phoneNumber: '+33123456789',
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        businessType: 'restaurant'
      };

      if (sendOTP.mockResolvedValue) {
        sendOTP.mockResolvedValue({ success: true, sid: 'test-sid' });
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('message');

      // Verify user was created in database
      const user = await User.findOne({ phoneNumber: userData.phoneNumber });
      expect(user).toBeTruthy();
      expect(user.businessName).toBe(userData.businessName);
    });

    it('should return 409 if user already exists', async () => {
      // Create existing user
      await global.testUtils.createTestUser({
        phoneNumber: '+33123456789'
      });

      const userData = {
        phoneNumber: '+33123456789',
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        businessType: 'restaurant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    let user;
    let otpRecord;

    beforeEach(async () => {
      // Create test user
      user = await global.testUtils.createTestUser({
        phoneNumber: '+33123456789',
        isVerified: false
      });

      // Create OTP record
      otpRecord = await Otp.create({
        phoneNumber: user.phoneNumber,
        code: '123456',
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
    });

    it('should verify OTP successfully', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: user.phoneNumber,
          code: '123456',
          type: 'registration'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify user is now verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isVerified).toBe(true);
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: user.phoneNumber,
          code: '999999',
          type: 'registration'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Auth Routes - Input Validation', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 for missing required fields', async () => {
      const userData = {
        ownerName: 'Test Owner'
        // Missing phoneNumber, businessName
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        phoneNumber: '+33123456789',
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        email: 'invalid-email',
        businessType: 'restaurant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid phone format', async () => {
      const userData = {
        phoneNumber: 'invalid-phone',
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        email: 'test@example.com',
        businessType: 'restaurant'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/request-otp', () => {
    it('should return 400 for missing phone number', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({ phoneNumber: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing phone number', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: 'invalid-phone'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '+33123456789'
          // Missing code and type
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: 'invalid-phone',
          code: '123456',
          type: 'registration'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid OTP type', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '+33123456789',
          code: '123456',
          type: 'invalid-type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid code format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '+33123456789',
          code: '12345', // Too short
          type: 'registration'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});