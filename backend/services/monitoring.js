const os = require('os');
const process = require('process');
const logger = require('../utils/logger');
const { getCacheStats } = require('../middleware/cache');

// Metrics storage
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byStatus: {},
    byEndpoint: {},
    errors: 0,
    averageResponseTime: 0,
    slowRequests: 0
  },
  system: {
    startTime: Date.now(),
    uptime: 0,
    memory: {},
    cpu: {},
    load: []
  },
  database: {
    connections: 0,
    queries: 0,
    errors: 0,
    averageQueryTime: 0
  },
  business: {
    activeUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    dishesServed: 0
  }
};

// Request tracking
const requestTimes = [];
const MAX_REQUEST_TIMES = 1000; // Keep last 1000 request times for average calculation

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment total requests
  metrics.requests.total++;
  
  // Track by method
  metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
  
  // Track by endpoint (use path since route isn't available yet)
  const endpoint = req.path;
  metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Track response time
    requestTimes.push(responseTime);
    if (requestTimes.length > MAX_REQUEST_TIMES) {
      requestTimes.shift();
    }
    
    // Track slow requests (> 1000ms)
    if (responseTime > 1000) {
      metrics.requests.slowRequests++;
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        userId: req.user ? req.user.id : null
      });
    }
    
    // Track by status code
    metrics.requests.byStatus[res.statusCode] = (metrics.requests.byStatus[res.statusCode] || 0) + 1;
    
    // Track errors
    if (res.statusCode >= 400) {
      metrics.requests.errors++;
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// System metrics collection
const collectSystemMetrics = () => {
  metrics.system.uptime = process.uptime();
  
  // Memory metrics
  const memUsage = process.memoryUsage();
  metrics.system.memory = {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    systemTotal: os.totalmem(),
    systemFree: os.freemem(),
    systemUsed: os.totalmem() - os.freemem()
  };
  
  // CPU metrics
  const cpus = os.cpus();
  metrics.system.cpu = {
    count: cpus.length,
    model: cpus[0].model,
    speed: cpus[0].speed,
    usage: process.cpuUsage()
  };
  
  // Load average
  metrics.system.load = os.loadavg();
};

// Database metrics (to be called from database operations)
const trackDatabaseQuery = (queryTime, isError = false) => {
  metrics.database.queries++;
  
  if (isError) {
    metrics.database.errors++;
  }
  
  // Update average query time
  const currentAvg = metrics.database.averageQueryTime;
  const totalQueries = metrics.database.queries;
  metrics.database.averageQueryTime = ((currentAvg * (totalQueries - 1)) + queryTime) / totalQueries;
};

// Business metrics (to be called from business operations)
const trackBusinessMetrics = {
  userLogin: () => {
    metrics.business.activeUsers++;
  },
  
  userLogout: () => {
    metrics.business.activeUsers = Math.max(0, metrics.business.activeUsers - 1);
  },
  
  orderCreated: (orderValue) => {
    metrics.business.totalOrders++;
    metrics.business.totalRevenue += orderValue;
  },
  
  dishServed: (quantity = 1) => {
    metrics.business.dishesServed += quantity;
  }
};

// Health check function
const getHealthStatus = () => {
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const systemMemoryUsagePercent = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
  const uptime = process.uptime();
  const errorRate = metrics.requests.total > 0 ? (metrics.requests.errors / metrics.requests.total) * 100 : 0;
  
  // Determine health status
  let status = 'healthy';
  const issues = [];
  
  if (memoryUsagePercent > 90) {
    status = 'unhealthy';
    issues.push('High memory usage');
  } else if (memoryUsagePercent > 75) {
    status = 'degraded';
    issues.push('Elevated memory usage');
  }
  
  if (systemMemoryUsagePercent > 95) {
    status = 'unhealthy';
    issues.push('System memory critical');
  }
  
  if (errorRate > 10) {
    status = 'unhealthy';
    issues.push('High error rate');
  } else if (errorRate > 5) {
    status = 'degraded';
    issues.push('Elevated error rate');
  }
  
  if (metrics.requests.averageResponseTime > 2000) {
    status = 'degraded';
    issues.push('Slow response times');
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime,
    issues,
    checks: {
      memory: {
        status: memoryUsagePercent < 75 ? 'healthy' : memoryUsagePercent < 90 ? 'degraded' : 'unhealthy',
        usage: `${memoryUsagePercent.toFixed(2)}%`,
        details: memUsage
      },
      systemMemory: {
        status: systemMemoryUsagePercent < 80 ? 'healthy' : systemMemoryUsagePercent < 95 ? 'degraded' : 'unhealthy',
        usage: `${systemMemoryUsagePercent.toFixed(2)}%`
      },
      errorRate: {
        status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
        rate: `${errorRate.toFixed(2)}%`,
        errors: metrics.requests.errors,
        total: metrics.requests.total
      },
      responseTime: {
        status: metrics.requests.averageResponseTime < 1000 ? 'healthy' : 'degraded',
        average: `${metrics.requests.averageResponseTime.toFixed(2)}ms`,
        slowRequests: metrics.requests.slowRequests
      }
    }
  };
};

// Get comprehensive metrics
const getMetrics = () => {
  collectSystemMetrics();
  
  return {
    timestamp: new Date().toISOString(),
    requests: {
      ...metrics.requests,
      responseTimes: requestTimes,
      averageResponseTime: requestTimes.length > 0 ? requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length : 0,
      errorRate: metrics.requests.total > 0 ? (metrics.requests.errors / metrics.requests.total) : 0,
      requestsPerSecond: metrics.requests.total / (process.uptime() || 1)
    },
    system: {
      ...metrics.system,
      memoryUsage: metrics.system.memory,
      cpuUsage: metrics.system.cpu.usage,
      memoryUsagePercent: (metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100,
      systemMemoryUsagePercent: (metrics.system.memory.systemUsed / metrics.system.memory.systemTotal) * 100
    },
    database: metrics.database,
    business: metrics.business,
    cache: getCacheStats()
  };
};

// Alert system
const alerts = {
  thresholds: {
    memoryUsage: 85,
    errorRate: 5,
    responseTime: 2000,
    systemMemory: 90
  },
  
  check: () => {
    const currentMetrics = getMetrics();
    const activeAlerts = [];
    
    // Memory usage alert
    if (currentMetrics.system.memoryUsagePercent > alerts.thresholds.memoryUsage) {
      activeAlerts.push({
        type: 'memory_usage',
        severity: 'warning',
        message: `High memory usage: ${currentMetrics.system.memoryUsagePercent.toFixed(2)}%`,
        threshold: alerts.thresholds.memoryUsage,
        current: currentMetrics.system.memoryUsagePercent
      });
    }
    
    // Error rate alert
    if (currentMetrics.requests.errorRate > alerts.thresholds.errorRate) {
      activeAlerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `High error rate: ${currentMetrics.requests.errorRate.toFixed(2)}%`,
        threshold: alerts.thresholds.errorRate,
        current: currentMetrics.requests.errorRate
      });
    }
    
    // Response time alert
    if (currentMetrics.requests.averageResponseTime > alerts.thresholds.responseTime) {
      activeAlerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `Slow response time: ${currentMetrics.requests.averageResponseTime.toFixed(2)}ms`,
        threshold: alerts.thresholds.responseTime,
        current: currentMetrics.requests.averageResponseTime
      });
    }
    
    // System memory alert
    if (currentMetrics.system.systemMemoryUsagePercent > alerts.thresholds.systemMemory) {
      activeAlerts.push({
        type: 'system_memory',
        severity: 'critical',
        message: `System memory critical: ${currentMetrics.system.systemMemoryUsagePercent.toFixed(2)}%`,
        threshold: alerts.thresholds.systemMemory,
        current: currentMetrics.system.systemMemoryUsagePercent
      });
    }
    
    // Log alerts
    activeAlerts.forEach(alert => {
      logger.warn('System Alert', alert);
    });
    
    return activeAlerts;
  }
};

// Start monitoring interval
let monitoringInterval;
const startMonitoring = (intervalMs = 60000) => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  monitoringInterval = setInterval(() => {
    collectSystemMetrics();
    alerts.check();
  }, intervalMs);
  
  logger.info('Monitoring started', { interval: intervalMs });
};

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('Monitoring stopped');
  }
};

// Graceful shutdown
process.on('SIGTERM', stopMonitoring);
process.on('SIGINT', stopMonitoring);

// Reset metrics for testing
const resetMetrics = () => {
  // Clear the request times array
  requestTimes.length = 0;
  
  metrics.requests = {
    total: 0,
    byMethod: {},
    byStatus: {},
    byEndpoint: {},
    errors: 0,
    responseTimes: [],
    averageResponseTime: 0,
    slowRequests: 0
  };
  
  metrics.system = {
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      systemUsed: 0,
      systemTotal: 0
    },
    cpu: {
      usage: 0,
      loadAverage: []
    },
    uptime: 0
  };
  
  metrics.database = {
    queries: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    errors: 0
  };
  
  metrics.business = {
    activeUsers: 0,
    orders: {
      total: 0,
      completed: 0,
      failed: 0
    },
    revenue: 0
  };
};

module.exports = {
  metricsMiddleware,
  getHealthStatus,
  getMetrics,
  resetMetrics,
  trackDatabaseQuery,
  trackBusinessMetrics,
  startMonitoring,
  stopMonitoring,
  alerts
};