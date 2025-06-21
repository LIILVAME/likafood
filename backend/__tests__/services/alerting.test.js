const { 
  checkMetrics, 
  sendAlert, 
  performHealthCheck, 
  updateThresholds, 
  getAlertState 
} = require('../../services/alerting');
const logger = require('../../utils/logger');

// Mock logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('Alerting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset alert state before each test
    const alertState = getAlertState();
    Object.keys(alertState.lastAlertTime).forEach(key => {
      alertState.lastAlertTime[key] = 0;
    });
  });

  describe('Threshold Checking', () => {
    it('should detect high memory usage', () => {
      const mockMetrics = {
        system: {
          memoryUsage: {
            rss: 1024 * 1024 * 1024, // 1GB
            heapUsed: 512 * 1024 * 1024 // 512MB
          }
        }
      };

      // Mock process.memoryUsage to return high memory
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 2 * 1024 * 1024 * 1024, // 2GB
        heapUsed: 1.5 * 1024 * 1024 * 1024, // 1.5GB
        heapTotal: 2 * 1024 * 1024 * 1024,
        external: 100 * 1024 * 1024
      });

      checkMetrics(mockMetrics);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage')
      );

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should detect high error rate', () => {
      const mockMetrics = {
        requests: {
          total: 100,
          errorRate: 0.15 // 15% error rate
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024, // Low memory
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      checkMetrics(mockMetrics);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High error rate')
      );
    });

    it('should detect slow response times', () => {
      const mockMetrics = {
        requests: {
          total: 50,
          avgResponseTime: 1200, // 1.2 seconds
          errorRate: 0.05
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      checkMetrics(mockMetrics);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow response time')
      );
    });
  });

  describe('Alert Cooldown', () => {
    it('should respect cooldown period for same alert type', () => {
      const mockMetrics = {
        requests: {
          total: 100,
          errorRate: 0.15,
          avgResponseTime: 100
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      // First alert should be sent
      checkMetrics(mockMetrics);
      expect(logger.warn).toHaveBeenCalledTimes(1);

      // Clear mock calls
      jest.clearAllMocks();

      // Second alert within cooldown should not be sent
      checkMetrics(mockMetrics);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should allow alerts after cooldown period', async () => {
      const mockMetrics = {
        requests: {
          total: 100,
          errorRate: 0.15,
          avgResponseTime: 100
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      // Send first alert
      checkMetrics(mockMetrics);
      expect(logger.warn).toHaveBeenCalledTimes(1);

      // Manually set last alert time to past cooldown
      const alertState = getAlertState();
      alertState.lastAlertTime.errorRate = Date.now() - (6 * 60 * 1000); // 6 minutes ago

      jest.clearAllMocks();

      // Second alert after cooldown should be sent
      checkMetrics(mockMetrics);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Health Check', () => {
    it('should perform basic health check', () => {
      const health = performHealthCheck();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cpu');

      expect(health.status).toBe('healthy');
      expect(typeof health.uptime).toBe('number');
      expect(health.uptime).toBeGreaterThan(0);
    });

    it('should include memory information', () => {
      const health = performHealthCheck();

      expect(health.memory).toHaveProperty('used');
      expect(health.memory).toHaveProperty('total');
      expect(health.memory).toHaveProperty('percentage');

      expect(typeof health.memory.used).toBe('number');
      expect(typeof health.memory.total).toBe('number');
      expect(typeof health.memory.percentage).toBe('number');
      expect(health.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(health.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should include CPU information', () => {
      const health = performHealthCheck();

      expect(health.cpu).toHaveProperty('user');
      expect(health.cpu).toHaveProperty('system');

      expect(typeof health.cpu.user).toBe('number');
      expect(typeof health.cpu.system).toBe('number');
    });
  });

  describe('Threshold Management', () => {
    it('should update thresholds correctly', () => {
      const newThresholds = {
        memoryUsage: 0.95,
        errorRate: 0.08,
        responseTime: 800
      };

      updateThresholds(newThresholds);

      // Test with metrics that should trigger alerts with new thresholds
      const mockMetrics = {
        requests: {
          total: 100,
          errorRate: 0.09, // Above new threshold
          avgResponseTime: 850 // Above new threshold
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      checkMetrics(mockMetrics);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High error rate')
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow response time')
      );
    });

    it('should validate threshold values', () => {
      const invalidThresholds = {
        memoryUsage: 1.5, // Invalid: > 1
        errorRate: -0.1, // Invalid: < 0
        responseTime: 'invalid' // Invalid: not a number
      };

      // Should not throw error but log warning
      expect(() => updateThresholds(invalidThresholds)).not.toThrow();
    });
  });

  describe('Alert State Management', () => {
    it('should maintain alert state correctly', () => {
      const alertState = getAlertState();

      expect(alertState).toHaveProperty('lastAlertTime');
      expect(alertState).toHaveProperty('thresholds');

      expect(typeof alertState.lastAlertTime).toBe('object');
      expect(typeof alertState.thresholds).toBe('object');
    });

    it('should track last alert times', () => {
      const mockMetrics = {
        requests: {
          total: 100,
          errorRate: 0.15,
          avgResponseTime: 100
        },
        system: {
          memoryUsage: {
            rss: 100 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024
          }
        }
      };

      const beforeTime = Date.now();
      checkMetrics(mockMetrics);
      const afterTime = Date.now();

      const alertState = getAlertState();
      expect(alertState.lastAlertTime.errorRate).toBeGreaterThanOrEqual(beforeTime);
      expect(alertState.lastAlertTime.errorRate).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing metrics gracefully', () => {
      const incompleteMetrics = {
        requests: {
          total: 50
          // Missing errorRate and avgResponseTime
        }
        // Missing system metrics
      };

      expect(() => checkMetrics(incompleteMetrics)).not.toThrow();
    });

    it('should handle null or undefined metrics', () => {
      expect(() => checkMetrics(null)).not.toThrow();
      expect(() => checkMetrics(undefined)).not.toThrow();
      expect(() => checkMetrics({})).not.toThrow();
    });
  });
});