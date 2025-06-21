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

describe('Monitoring Debug', () => {
  let app;

  beforeEach(() => {
    resetMetrics();
    app = express();
    app.use(express.json());
    app.use(metricsMiddleware);
    
    // Add test routes
    app.get('/api/test', (req, res) => {
      res.json({ message: 'test response' });
    });
  });

  it('should track a single request', async () => {
    // Test that middleware is working by checking if metrics change
    const initialMetrics = getMetrics();
    console.log('Initial total:', initialMetrics.requests.total);
    
    const response = await request(app).get('/api/test');
    console.log('Response status:', response.status);
    
    const finalMetrics = getMetrics();
    console.log('Final total:', finalMetrics.requests.total);
    console.log('Response times length:', finalMetrics.requests.responseTimes.length);
    
    // Just check if the middleware is working at all
    expect(finalMetrics.requests.total).toBeGreaterThan(initialMetrics.requests.total);
  });
});