const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const dishesRoutes = require('../../routes/dishes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishesRoutes);

describe('Basic Route Tests', () => {
  describe('Auth Routes Existence', () => {
    it('should respond to POST /api/auth/register', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should respond to POST /api/auth/request-otp', async () => {
      const response = await request(app)
        .post('/api/auth/request-otp')
        .send({});

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should respond to POST /api/auth/login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should respond to POST /api/auth/verify-otp', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({});

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Dishes Routes Existence', () => {
    it('should respond to GET /api/dishes', async () => {
      const response = await request(app)
        .get('/api/dishes');

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should respond to POST /api/dishes', async () => {
      const response = await request(app)
        .post('/api/dishes')
        .send({});

      // Should not return 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Response Format', () => {
    it('should return JSON responses', async () => {
      const response = await request(app)
        .get('/api/dishes');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have consistent response structure', async () => {
      const response = await request(app)
        .get('/api/dishes');

      expect(response.body).toHaveProperty('success');
      expect(typeof response.body.success).toBe('boolean');
    });
  });
});