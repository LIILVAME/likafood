const logger = require('../utils/logger');
const os = require('os');

// Alert configuration
const ALERT_THRESHOLDS = {
  memory: {
    warning: 80, // 80% memory usage
    critical: 95 // 95% memory usage
  },
  cpu: {
    warning: 80, // 80% CPU usage
    critical: 95 // 95% CPU usage
  },
  responseTime: {
    warning: 1000, // 1 second
    critical: 3000 // 3 seconds
  },
  errorRate: {
    warning: 5, // 5% error rate
    critical: 10 // 10% error rate
  },
  diskSpace: {
    warning: 80, // 80% disk usage
    critical: 95 // 95% disk usage
  }
};

// Alert state tracking
const alertState = {
  memory: { level: 'normal', lastAlert: null, count: 0 },
  cpu: { level: 'normal', lastAlert: null, count: 0 },
  responseTime: { level: 'normal', lastAlert: null, count: 0 },
  errorRate: { level: 'normal', lastAlert: null, count: 0 },
  diskSpace: { level: 'normal', lastAlert: null, count: 0 }
};

// Alert cooldown period (5 minutes)
const ALERT_COOLDOWN = 5 * 60 * 1000;

// Alert handlers
const alertHandlers = {
  // Log alert to console and file
  log: (alert) => {
    const logLevel = alert.level === 'critical' ? 'error' : 'warn';
    logger[logLevel](`🚨 ALERT [${alert.level.toUpperCase()}]: ${alert.message}`, {
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: alert.timestamp,
      count: alert.count
    });
  },

  // Send email alert (placeholder - would integrate with email service)
  email: async (alert) => {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      logger.info('Email alert would be sent:', {
        to: process.env.ALERT_EMAIL,
        subject: `🚨 LikaFood Alert: ${alert.metric} ${alert.level}`,
        body: alert.message
      });
    }
  },

  // Send webhook alert (placeholder - would integrate with Slack, Discord, etc.)
  webhook: async (alert) => {
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        // TODO: Implement webhook notification
        logger.info('Webhook alert would be sent:', {
          url: process.env.ALERT_WEBHOOK_URL,
          alert: alert
        });
      } catch (error) {
        logger.error('Failed to send webhook alert:', { error: error.message });
      }
    }
  }
};

// Check if alert should be sent (respects cooldown)
const shouldSendAlert = (metric, level) => {
  const state = alertState[metric];
  const now = Date.now();
  
  // If level changed or enough time passed since last alert
  if (state.level !== level || (state.lastAlert && now - state.lastAlert > ALERT_COOLDOWN)) {
    return true;
  }
  
  return false;
};

// Send alert through all configured handlers
const sendAlert = async (metric, level, message, value, threshold) => {
  const alert = {
    metric,
    level,
    message,
    value,
    threshold,
    timestamp: new Date().toISOString(),
    count: alertState[metric].count + 1
  };

  // Update alert state
  alertState[metric] = {
    level,
    lastAlert: Date.now(),
    count: alert.count
  };

  // Send through all handlers
  try {
    await Promise.all([
      alertHandlers.log(alert),
      alertHandlers.email(alert),
      alertHandlers.webhook(alert)
    ]);
  } catch (error) {
    logger.error('Failed to send alert:', { error: error.message, alert });
  }
};

// Memory monitoring
const checkMemoryUsage = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  let level = 'normal';
  if (memoryUsagePercent >= ALERT_THRESHOLDS.memory.critical) {
    level = 'critical';
  } else if (memoryUsagePercent >= ALERT_THRESHOLDS.memory.warning) {
    level = 'warning';
  }

  if (level !== 'normal' && shouldSendAlert('memory', level)) {
    sendAlert(
      'memory',
      level,
      `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      memoryUsagePercent,
      level === 'critical' ? ALERT_THRESHOLDS.memory.critical : ALERT_THRESHOLDS.memory.warning
    );
  }

  return { usage: memoryUsagePercent, level };
};

// CPU monitoring
const checkCpuUsage = () => {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const cpuUsagePercent = 100 - ~~(100 * idle / total);

  let level = 'normal';
  if (cpuUsagePercent >= ALERT_THRESHOLDS.cpu.critical) {
    level = 'critical';
  } else if (cpuUsagePercent >= ALERT_THRESHOLDS.cpu.warning) {
    level = 'warning';
  }

  if (level !== 'normal' && shouldSendAlert('cpu', level)) {
    sendAlert(
      'cpu',
      level,
      `High CPU usage: ${cpuUsagePercent.toFixed(2)}%`,
      cpuUsagePercent,
      level === 'critical' ? ALERT_THRESHOLDS.cpu.critical : ALERT_THRESHOLDS.cpu.warning
    );
  }

  return { usage: cpuUsagePercent, level };
};

// Response time monitoring
const checkResponseTime = (averageResponseTime) => {
  let level = 'normal';
  if (averageResponseTime >= ALERT_THRESHOLDS.responseTime.critical) {
    level = 'critical';
  } else if (averageResponseTime >= ALERT_THRESHOLDS.responseTime.warning) {
    level = 'warning';
  }

  if (level !== 'normal' && shouldSendAlert('responseTime', level)) {
    sendAlert(
      'responseTime',
      level,
      `High response time: ${averageResponseTime.toFixed(2)}ms`,
      averageResponseTime,
      level === 'critical' ? ALERT_THRESHOLDS.responseTime.critical : ALERT_THRESHOLDS.responseTime.warning
    );
  }

  return { responseTime: averageResponseTime, level };
};

// Error rate monitoring
const checkErrorRate = (totalRequests, errorCount) => {
  if (totalRequests === 0) return { errorRate: 0, level: 'normal' };
  
  const errorRate = (errorCount / totalRequests) * 100;
  
  let level = 'normal';
  if (errorRate >= ALERT_THRESHOLDS.errorRate.critical) {
    level = 'critical';
  } else if (errorRate >= ALERT_THRESHOLDS.errorRate.warning) {
    level = 'warning';
  }

  if (level !== 'normal' && shouldSendAlert('errorRate', level)) {
    sendAlert(
      'errorRate',
      level,
      `High error rate: ${errorRate.toFixed(2)}%`,
      errorRate,
      level === 'critical' ? ALERT_THRESHOLDS.errorRate.critical : ALERT_THRESHOLDS.errorRate.warning
    );
  }

  return { errorRate, level };
};

// Disk space monitoring
const checkDiskSpace = () => {
  // This is a simplified check - in production, you'd want to check actual disk usage
  // For now, we'll simulate or skip this check
  return { usage: 0, level: 'normal' };
};

// Main health check function
const performHealthCheck = (metrics) => {
  const checks = {
    memory: checkMemoryUsage(),
    cpu: checkCpuUsage(),
    responseTime: checkResponseTime(metrics?.requests?.averageResponseTime || 0),
    errorRate: checkErrorRate(metrics?.requests?.total || 0, metrics?.requests?.errors || 0),
    diskSpace: checkDiskSpace()
  };

  // Determine overall system health
  const levels = Object.values(checks).map(check => check.level);
  let overallHealth = 'healthy';
  
  if (levels.includes('critical')) {
    overallHealth = 'critical';
  } else if (levels.includes('warning')) {
    overallHealth = 'degraded';
  }

  return {
    overall: overallHealth,
    checks,
    timestamp: new Date().toISOString()
  };
};

// Get alert statistics
const getAlertStats = () => {
  return {
    thresholds: ALERT_THRESHOLDS,
    state: alertState,
    cooldown: ALERT_COOLDOWN
  };
};

// Reset alert counters
const resetAlertCounters = () => {
  Object.keys(alertState).forEach(metric => {
    alertState[metric].count = 0;
  });
  logger.info('Alert counters reset');
};

// Configure alert thresholds
const updateThresholds = (newThresholds) => {
  Object.assign(ALERT_THRESHOLDS, newThresholds);
  logger.info('Alert thresholds updated:', newThresholds);
};

module.exports = {
  performHealthCheck,
  getAlertStats,
  resetAlertCounters,
  updateThresholds,
  ALERT_THRESHOLDS
};