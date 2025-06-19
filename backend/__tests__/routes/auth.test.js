const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const authRoutes = require('../../routes/auth');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

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