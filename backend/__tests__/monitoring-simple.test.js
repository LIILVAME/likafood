const express = require('express');
const request = require('supertest');

// Simple monitoring middleware without cache dependency
let requestCount = 0;
const simpleMetricsMiddleware = (req, res, next) => {
  requestCount++;
  next();
};

const getRequestCount = () => requestCount;
const resetRequestCount = () => { requestCount = 0; };

describe('Simple Monitoring Test', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(simpleMetricsMiddleware);
    
    app.get('/api/test', (req, res) => {
      res.json({ message: 'test response' });
    });
    
    resetRequestCount();
  });

  it('should track requests', async () => {
    await request(app).get('/api/test').expect(200);
    expect(getRequestCount()).toBe(1);
  });
});