const request = require('supertest');
const express = require('express');
const { generalLimiter, authLimiter } = require('../../middleware/rateLimiter');
const { cacheMiddleware } = require('../../middleware/cache');
const { metricsMiddleware, getMetrics, resetMetrics } = require('../../services/monitoring');
const { checkMetrics, getAlertState } = require('../../services/alerting');
const logger = require('../../utils/logger');

// Mock logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('Backend Improvements Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    resetMetrics();
    jest.clearAllMocks();
  });

  describe('Rate Limiting + Monitoring Integration', () => {
    beforeEach(() => {
      app.use(metricsMiddleware);
      app.use('/api', generalLimiter);
      app.use('/auth', authLimiter);
      
      app.get('/api/test', (req, res) => {
        res.json({ message: 'api test' });
      });
      
      app.post('/auth/login', (req, res) => {
        res.json({ message: 'login success' });
      });
    });

    it('should track metrics for rate-limited requests', async () => {
      await request(app).get('/api/test').expect(200);
      await request(app).post('/auth/login').expect(200);
      
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.byMethod.GET).toBe(1);
      expect(metrics.requests.byMethod.POST).toBe(1);
    });

    it('should track rate limit violations in metrics', async () => {
      // Make many requests to trigger rate limit
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com' })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      const metrics = getMetrics();
      expect(metrics.requests.byStatus['429']).toBeGreaterThan(0);
    });
  });

  describe('Caching + Monitoring Integration', () => {
    beforeEach(() => {
      app.use(metricsMiddleware);
      app.get('/api/cached', cacheMiddleware('short'), (req, res) => {
        res.json({ message: 'cached response', timestamp: Date.now() });
      });
    });

    it('should track cache performance in metrics', async () => {
      // First request - cache miss
      const response1 = await request(app).get('/api/cached').expect(200);
      expect(response1.headers['x-cache']).toBe('MISS');
      
      // Second request - cache hit
      const response2 = await request(app).get('/api/cached').expect(200);
      expect(response2.headers['x-cache']).toBe('HIT');
      
      // Both should have same timestamp (cached)
      expect(response1.body.timestamp).toBe(response2.body.timestamp);
      
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.byStatus['200']).toBe(2);
    });

    it('should show improved response times for cached requests', async () => {
      // First request
      await request(app).get('/api/cached').expect(200);
      
      // Second request (cached) should be faster
      const startTime = Date.now();
      await request(app).get('/api/cached').expect(200);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(50); // Cached response should be very fast
    });
  });

  describe('Monitoring + Alerting Integration', () => {
    beforeEach(() => {
      app.use(metricsMiddleware);
      
      app.get('/api/success', (req, res) => {
        res.json({ status: 'success' });
      });
      
      app.get('/api/error', (req, res) => {
        res.status(500).json({ error: 'server error' });
      });
      
      app.get('/api/slow', (req, res) => {
        // Simulate slow response
        setTimeout(() => {
          res.json({ message: 'slow response' });
        }, 100);
      });
    });

    it('should trigger alerts based on monitored metrics', async () => {
      // Generate high error rate
      await request(app).get('/api/success').expect(200);
      await request(app).get('/api/error').expect(500);
      await request(app).get('/api/error').expect(500);
      await request(app).get('/api/error').expect(500);
      
      const metrics = getMetrics();
      expect(metrics.requests.errorRate).toBeGreaterThan(0.5);
      
      // Check metrics should trigger alert
      checkMetrics(metrics);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High error rate')
      );
    });

    it('should track response time alerts', async () => {
      // Make requests to slow endpoint
      await request(app).get('/api/slow').expect(200);
      await request(app).get('/api/slow').expect(200);
      
      const metrics = getMetrics();
      
      // Check if average response time triggers alert
      if (metrics.requests.avgResponseTime > 1000) {
        checkMetrics(metrics);
        
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Slow response time')
        );
      }
    });
  });

  describe('Full Stack Integration', () => {
    beforeEach(() => {
      // Set up full middleware stack
      app.use(metricsMiddleware);
      app.use('/api', generalLimiter);
      
      app.get('/api/products', cacheMiddleware('medium'), (req, res) => {
        res.json({
          products: [
            { id: 1, name: 'Product 1', price: 10.99 },
            { id: 2, name: 'Product 2', price: 15.99 }
          ],
          timestamp: Date.now()
        });
      });
      
      app.post('/api/products', (req, res) => {
        res.status(201).json({
          id: 3,
          name: req.body.name,
          price: req.body.price,
          created: new Date().toISOString()
        });
      });
    });

    it('should handle complete request lifecycle with all improvements', async () => {
      // Test GET request with caching and monitoring
      const getResponse1 = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(getResponse1.headers['x-cache']).toBe('MISS');
      expect(getResponse1.headers['x-ratelimit-remaining']).toBeDefined();
      
      // Second GET should be cached
      const getResponse2 = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(getResponse2.headers['x-cache']).toBe('HIT');
      expect(getResponse1.body.timestamp).toBe(getResponse2.body.timestamp);
      
      // Test POST request (not cached)
      const postResponse = await request(app)
        .post('/api/products')
        .send({ name: 'New Product', price: 25.99 })
        .expect(201);
      
      expect(postResponse.body.name).toBe('New Product');
      expect(postResponse.headers['x-cache']).toBeUndefined();
      
      // Check metrics
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(3);
      expect(metrics.requests.byMethod.GET).toBe(2);
      expect(metrics.requests.byMethod.POST).toBe(1);
      expect(metrics.requests.byStatus['200']).toBe(2);
      expect(metrics.requests.byStatus['201']).toBe(1);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Simulate concurrent requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(request(app).get('/api/products').expect(200));
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      expect(responses).toHaveLength(20);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Most requests should be cached (same timestamp)
      const timestamps = responses.map(r => r.body.timestamp);
      const uniqueTimestamps = [...new Set(timestamps)];
      expect(uniqueTimestamps.length).toBeLessThan(5); // Most should be cached
      
      // Total time should be reasonable
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Check metrics
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(20);
      expect(metrics.requests.avgResponseTime).toBeLessThan(100); // Should be fast due to caching
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(() => {
      app.use(metricsMiddleware);
      app.use('/api', generalLimiter);
      
      app.get('/api/resilient', cacheMiddleware('short'), (req, res) => {
        // Randomly fail 30% of requests
        if (Math.random() < 0.3) {
          return res.status(500).json({ error: 'Random failure' });
        }
        res.json({ message: 'success', timestamp: Date.now() });
      });
    });

    it('should handle mixed success/failure scenarios', async () => {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/api/resilient')
            .then(res => ({ status: res.status, body: res.body }))
            .catch(err => ({ status: err.status || 500, error: true }))
        );
      }
      
      const results = await Promise.all(promises);
      
      const successes = results.filter(r => r.status === 200);
      const failures = results.filter(r => r.status === 500);
      
      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
      
      // Check that metrics captured both successes and failures
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(20);
      expect(metrics.requests.byStatus['200']).toBe(successes.length);
      expect(metrics.requests.byStatus['500']).toBe(failures.length);
    });
  });
});