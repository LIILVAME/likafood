const request = require('supertest');
const express = require('express');
const redis = require('redis');
const { 
  redisCache, 
  invalidateCache, 
  getCacheStats, 
  warmupCache 
} = require('../../middleware/redisCache');

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushAll: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    isOpen: true
  }))
}));

describe('Redis Cache Middleware', () => {
  let app;
  let mockRedisClient;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Get the mocked Redis client
    mockRedisClient = redis.createClient();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Basic Redis Caching', () => {
    beforeEach(() => {
      app.get('/api/test', redisCache(300), (req, res) => {
        res.json({ message: 'test response', timestamp: Date.now() });
      });
    });

    it('should cache GET requests in Redis', async () => {
      // Mock Redis get to return null (cache miss)
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(response.headers['x-cache']).toBe('MISS');
    });

    it('should return cached data from Redis', async () => {
      const cachedData = JSON.stringify({
        message: 'cached response',
        timestamp: 1234567890
      });
      
      // Mock Redis get to return cached data
      mockRedisClient.get.mockResolvedValue(cachedData);

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      expect(response.headers['x-cache']).toBe('HIT');
      expect(response.body.message).toBe('cached response');
      expect(response.body.timestamp).toBe(1234567890);
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Mock Redis get to throw an error
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      // Should still return response even if Redis fails
      expect(response.body.message).toBe('test response');
      expect(response.headers['x-cache']).toBe('MISS');
    });
  });

  describe('Cache Key Generation', () => {
    beforeEach(() => {
      app.get('/api/user/:id', redisCache(300, 'user'), (req, res) => {
        res.json({ userId: req.params.id, data: 'user data' });
      });
      
      app.get('/api/search', redisCache(300), (req, res) => {
        res.json({ query: req.query.q, results: [] });
      });
    });

    it('should generate unique cache keys for different routes', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await request(app).get('/api/user/123').expect(200);
      await request(app).get('/api/user/456').expect(200);

      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(2);
      
      // Check that different cache keys were used
      const calls = mockRedisClient.setEx.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it('should include query parameters in cache key', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await request(app).get('/api/search?q=test').expect(200);
      await request(app).get('/api/search?q=other').expect(200);

      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      
      // Different queries should have different cache keys
      const getCalls = mockRedisClient.get.mock.calls;
      expect(getCalls[0][0]).not.toBe(getCalls[1][0]);
    });

    it('should use custom cache prefix when provided', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await request(app).get('/api/user/123').expect(200);

      const cacheKey = mockRedisClient.get.mock.calls[0][0];
      expect(cacheKey).toContain('user');
    });
  });

  describe('Cache TTL Management', () => {
    beforeEach(() => {
      app.get('/api/short', redisCache(60), (req, res) => {
        res.json({ type: 'short', data: 'short-lived data' });
      });
      
      app.get('/api/long', redisCache(3600), (req, res) => {
        res.json({ type: 'long', data: 'long-lived data' });
      });
    });

    it('should set correct TTL for different cache durations', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await request(app).get('/api/short').expect(200);
      await request(app).get('/api/long').expect(200);

      const setExCalls = mockRedisClient.setEx.mock.calls;
      
      // Check TTL values
      expect(setExCalls[0][1]).toBe(60);   // Short cache
      expect(setExCalls[1][1]).toBe(3600); // Long cache
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache by pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['cache:user:123', 'cache:user:456']);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await invalidateCache('user:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('cache:user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['cache:user:123', 'cache:user:456']);
      expect(result).toBe(2);
    });

    it('should handle invalidation errors gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await invalidateCache('user:*');

      expect(result).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      app.get('/api/stats', redisCache(300), (req, res) => {
        res.json({ message: 'stats test' });
      });

      // First request - cache miss
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.setEx.mockResolvedValue('OK');
      
      await request(app).get('/api/stats').expect(200);

      // Second request - cache hit
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ message: 'cached stats' }));
      
      await request(app).get('/api/stats').expect(200);

      const stats = getCacheStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });

    it('should track cache operations', async () => {
      app.get('/api/operations', redisCache(300), (req, res) => {
        res.json({ message: 'operations test' });
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      await request(app).get('/api/operations').expect(200);

      const stats = getCacheStats();
      expect(stats.sets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cache Warmup', () => {
    it('should warm up cache with provided data', async () => {
      const warmupData = [
        { key: 'user:123', data: { id: 123, name: 'John' }, ttl: 300 },
        { key: 'user:456', data: { id: 456, name: 'Jane' }, ttl: 600 }
      ];

      mockRedisClient.setEx.mockResolvedValue('OK');

      await warmupCache(warmupData);

      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'cache:user:123',
        300,
        JSON.stringify({ id: 123, name: 'John' })
      );
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'cache:user:456',
        600,
        JSON.stringify({ id: 456, name: 'Jane' })
      );
    });

    it('should handle warmup errors gracefully', async () => {
      const warmupData = [
        { key: 'user:123', data: { id: 123 }, ttl: 300 }
      ];

      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      // Should not throw error
      await expect(warmupCache(warmupData)).resolves.not.toThrow();
    });
  });

  describe('Non-GET Request Handling', () => {
    beforeEach(() => {
      app.post('/api/test', redisCache(300), (req, res) => {
        res.json({ message: 'post response', timestamp: Date.now() });
      });
      
      app.put('/api/test', redisCache(300), (req, res) => {
        res.json({ message: 'put response', timestamp: Date.now() });
      });
    });

    it('should not cache POST requests', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(200);

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      expect(response.headers['x-cache']).toBeUndefined();
    });

    it('should not cache PUT requests', async () => {
      const response = await request(app)
        .put('/api/test')
        .send({ data: 'test' })
        .expect(200);

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      expect(response.headers['x-cache']).toBeUndefined();
    });
  });
});