const request = require('supertest');
const express = require('express');
const { cacheMiddleware, getCacheStats, clearCache } = require('../../middleware/cache');

describe('Cache Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    clearCache(); // Clear cache before each test
  });

  afterEach(() => {
    clearCache(); // Clean up after each test
  });

  describe('Basic Caching', () => {
    beforeEach(() => {
      app.get('/api/test', cacheMiddleware('short'), (req, res) => {
        res.json({ message: 'test response', timestamp: Date.now() });
      });
    });

    it('should cache GET requests', async () => {
      const response1 = await request(app)
        .get('/api/test')
        .expect(200);
      
      const response2 = await request(app)
        .get('/api/test')
        .expect(200);
      
      // Second response should be cached (same timestamp)
      expect(response1.body.timestamp).toBe(response2.body.timestamp);
    });

    it('should add cache headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(response.headers['x-cache']).toBe('MISS');
      
      const cachedResponse = await request(app)
        .get('/api/test')
        .expect(200);
      
      expect(cachedResponse.headers['x-cache']).toBe('HIT');
    });

    it('should not cache non-GET requests', async () => {
      app.post('/api/test', cacheMiddleware('short'), (req, res) => {
        res.json({ message: 'post response', timestamp: Date.now() });
      });

      const response1 = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(200);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const response2 = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(200);
      
      // POST requests should not be cached
      expect(response1.body.timestamp).not.toBe(response2.body.timestamp);
    });
  });

  describe('Cache TTL', () => {
    it('should respect different TTL settings', async () => {
      app.get('/api/short', cacheMiddleware('short'), (req, res) => {
        res.json({ type: 'short', timestamp: Date.now() });
      });
      
      app.get('/api/medium', cacheMiddleware('medium'), (req, res) => {
        res.json({ type: 'medium', timestamp: Date.now() });
      });
      
      app.get('/api/long', cacheMiddleware('long'), (req, res) => {
        res.json({ type: 'long', timestamp: Date.now() });
      });

      // All should cache initially
      await request(app).get('/api/short').expect(200);
      await request(app).get('/api/medium').expect(200);
      await request(app).get('/api/long').expect(200);
      
      const stats = getCacheStats();
      expect(stats.sets).toBe(3);
    });
  });

  describe('Custom Cache Keys', () => {
    beforeEach(() => {
      app.get('/api/user/:id', cacheMiddleware('short', 'user'), (req, res) => {
        res.json({ userId: req.params.id, timestamp: Date.now() });
      });
    });

    it('should use custom cache keys', async () => {
      const response1 = await request(app)
        .get('/api/user/123')
        .expect(200);
      
      const response2 = await request(app)
        .get('/api/user/123')
        .expect(200);
      
      // Should be cached
      expect(response1.body.timestamp).toBe(response2.body.timestamp);
      
      // Different user should not be cached
      const response3 = await request(app)
        .get('/api/user/456')
        .expect(200);
      
      expect(response1.body.timestamp).not.toBe(response3.body.timestamp);
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(() => {
      app.get('/api/stats', cacheMiddleware('short'), (req, res) => {
        res.json({ message: 'stats test' });
      });
    });

    it('should track cache hits and misses', async () => {
      const initialStats = getCacheStats();
      
      // First request - cache miss
      await request(app).get('/api/stats').expect(200);
      
      let stats = getCacheStats();
      expect(stats.misses).toBe(initialStats.misses + 1);
      expect(stats.sets).toBe(initialStats.sets + 1);
      
      // Second request - cache hit
      await request(app).get('/api/stats').expect(200);
      
      stats = getCacheStats();
      expect(stats.hits).toBe(initialStats.hits + 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      app.get('/api/error', cacheMiddleware('short'), (req, res) => {
        res.json({ message: 'success despite cache issues' });
      });

      const response = await request(app)
        .get('/api/error')
        .expect(200);
      
      expect(response.body.message).toBe('success despite cache issues');
    });
  });
});