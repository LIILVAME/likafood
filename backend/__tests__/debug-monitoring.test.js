const express = require('express');
const request = require('supertest');
const { metricsMiddleware, getMetrics, resetMetrics } = require('../services/monitoring');

describe('Debug Monitoring', () => {
  it('should work with basic setup', async () => {
    const app = express();
    app.use(express.json());
    app.use(metricsMiddleware);
    
    app.get('/api/test', (req, res) => {
      res.json({ message: 'test' });
    });
    
    const response = await request(app).get('/api/test');
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    expect(response.status).toBe(200);
  });
});