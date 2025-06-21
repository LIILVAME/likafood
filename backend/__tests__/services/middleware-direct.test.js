const { metricsMiddleware, getMetrics, resetMetrics } = require('../../services/monitoring');

describe('Direct Middleware Test', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('should work when called directly', (done) => {
    const req = {
      method: 'GET',
      path: '/api/test'
    };
    
    const res = {
      end: function() {
        console.log('Original res.end called');
      }
    };
    
    const next = () => {
      console.log('next() called');
      
      // Simulate response ending
      setTimeout(() => {
        res.end();
        
        const metrics = getMetrics();
        console.log('Metrics after direct call:', JSON.stringify(metrics.requests, null, 2));
        
        expect(metrics.requests.total).toBe(1);
        done();
      }, 10);
    };
    
    console.log('Calling middleware directly...');
    metricsMiddleware(req, res, next);
  });
});