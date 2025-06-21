const express = require('express');
const request = require('supertest');

// Mock dependencies to avoid issues
jest.mock('../../middleware/cache', () => ({
  getCacheStats: () => ({ hits: 0, misses: 0, sets: 0 })
}));

jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

const { metricsMiddleware, getMetrics, resetMetrics } = require('../../services/monitoring');

describe('Monitoring Service', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(metricsMiddleware);
    
    // Add test routes
    app.get('/api/test', (req, res) => {
      res.json({ message: 'test response' });
    });
    
    app.post('/api/test', (req, res) => {
      res.json({ message: 'post response' });
    });
    
    app.get('/api/error', (req, res) => {
      res.status(500).json({ error: 'test error' });
    });
    
    resetMetrics(); // Reset metrics before each test
  });

  afterEach(() => {
    resetMetrics(); // Clean up after each test
  });

  describe('Request Metrics', () => {

    it('should track total requests', async () => {
      await request(app).get('/api/test');
      await request(app).post('/api/test');
      
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(2);
    });

    it('should track requests by method', async () => {
      await request(app).get('/api/test');
      await request(app).post('/api/test');
      await request(app).get('/api/test');
      
      const metrics = getMetrics();
      expect(metrics.requests.byMethod.GET).toBe(2);
      expect(metrics.requests.byMethod.POST).toBe(1);
    });

    it('should track requests by status code', async () => {
      await request(app).get('/api/test');
      await request(app).get('/api/error');
      await request(app).get('/api/test');
      
      const metrics = getMetrics();
      expect(metrics.requests.byStatus[200]).toBe(2);
      expect(metrics.requests.byStatus[500]).toBe(1);
    });

    it('should track response times', async () => {
      await request(app).get('/api/test');
      
      // Small delay to ensure middleware processing is complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = getMetrics();
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(0);
    });

    it('should calculate average response time', async () => {
      // Make multiple requests
      await request(app).get('/api/test');
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      // Small delay to ensure middleware processing is complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const metrics = getMetrics();
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('System Metrics', () => {
    it('should collect system metrics', async () => {
      await request(app).get('/api/test');
      
      const metrics = getMetrics();
      
      expect(metrics.system).toBeDefined();
      expect(typeof metrics.system.memoryUsage).toBe('object');
      expect(typeof metrics.system.cpuUsage).toBe('object');
      expect(typeof metrics.system.uptime).toBe('number');
    });

    it('should track memory usage', async () => {
      const metrics = getMetrics();
      
      expect(metrics.system.memoryUsage.rss).toBeGreaterThan(0);
      expect(metrics.system.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(metrics.system.memoryUsage.heapTotal).toBeGreaterThan(0);
      expect(metrics.system.memoryUsage.external).toBeGreaterThanOrEqual(0);
    });

    it('should track CPU usage', async () => {
      const metrics = getMetrics();
      
      expect(typeof metrics.system.cpuUsage.user).toBe('number');
      expect(typeof metrics.system.cpuUsage.system).toBe('number');
    });
  });

  describe('Error Tracking', () => {
    beforeEach(() => {
      app.get('/api/error', (req, res) => {
        res.status(500).json({ error: 'test error' });
      });
      
      app.get('/api/not-found', (req, res) => {
        res.status(404).json({ error: 'not found' });
      });
    });

    it('should track error rates', async () => {
      await request(app).get('/api/test');
      await request(app).get('/api/error');
      await request(app).get('/api/not-found');
      
      const metrics = getMetrics();
      expect(metrics.requests.errorRate).toBeCloseTo(0.67, 1); // 2 errors out of 3 requests
    });

    it('should track 4xx and 5xx errors separately', async () => {
      await request(app).get('/api/error');
      await request(app).get('/api/not-found');
      
      const metrics = getMetrics();
      expect(metrics.requests.byStatus['404']).toBe(1);
      expect(metrics.requests.byStatus['500']).toBe(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should track request duration distribution', async () => {
      // Make multiple requests to get distribution data
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/test');
      }
      
      // Small delay to ensure middleware processing is complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = getMetrics();
      expect(metrics.requests.responseTimes).toHaveLength(5);
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(0);
    });

    it('should handle concurrent requests', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/api/test'));
      }
      
      await Promise.all(promises);
      
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(10);
      expect(metrics.requests.responseTimes).toHaveLength(10);
    });
  });

  describe('Metrics Reset', () => {
    it('should reset metrics correctly', async () => {
      await request(app).get('/api/test');
      
      let metrics = getMetrics();
      expect(metrics.requests.total).toBe(1);
      
      resetMetrics();
      
      metrics = getMetrics();
      expect(metrics.requests.total).toBe(0);
      expect(metrics.requests.responseTimes).toHaveLength(0);
    });
  });
});