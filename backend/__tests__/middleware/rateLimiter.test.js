const request = require('supertest');
const express = require('express');
const { generalLimiter, authLimiter, otpLimiter, createLimiter } = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('General Limiter', () => {
    beforeEach(() => {
      app.use('/api', generalLimiter);
      app.get('/api/test', (req, res) => res.json({ message: 'success' }));
    });

    it('should allow requests within limit', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(response.body.message).toBe('success');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining'] || response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Auth Limiter', () => {
    beforeEach(() => {
      app.use('/auth', authLimiter);
      app.post('/auth/login', (req, res) => res.json({ message: 'login success' }));
    });

    it('should allow auth requests within limit', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200);
      
      expect(response.body.message).toBe('login success');
    });

    it('should have stricter limits than general limiter', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200);
      
      const limit = parseInt(response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(5); // Auth limiter should be more restrictive
    });
  });

  describe('OTP Limiter', () => {
    beforeEach(() => {
      app.use('/otp', otpLimiter);
      app.post('/otp/send', (req, res) => res.json({ message: 'otp sent' }));
    });

    it('should allow OTP requests within limit', async () => {
      const response = await request(app)
        .post('/otp/send')
        .send({ phone: '+1234567890' })
        .expect(200);
      
      expect(response.body.message).toBe('otp sent');
    });

    it('should have very strict limits for OTP', async () => {
      const response = await request(app)
        .post('/otp/send')
        .send({ phone: '+1234567890' })
        .expect(200);
      
      const limit = parseInt(response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(5); // OTP should be very restrictive
    });
  });

  describe('Create Limiter', () => {
    beforeEach(() => {
      app.use('/create', createLimiter);
      app.post('/create/item', (req, res) => res.json({ message: 'item created' }));
    });

    it('should allow create requests within limit', async () => {
      const response = await request(app)
        .post('/create/item')
        .send({ name: 'test item' })
        .expect(200);
      
      expect(response.body.message).toBe('item created');
    });

    it('should have moderate limits for creation', async () => {
      const response = await request(app)
        .post('/create/item')
        .send({ name: 'test item' })
        .expect(200);
      
      const limit = parseInt(response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit']);
      expect(limit).toBeLessThanOrEqual(10); // Create limiter should be moderately restrictive
    });
  });
});