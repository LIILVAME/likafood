const express = require('express');
const { getHealthStatus, getMetrics, alerts } = require('../services/monitoring');
const { getCacheStats, invalidateCache } = require('../middleware/cache');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Get application health status
 *     description: Returns the current health status of the application including system checks
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *                 checks:
 *                   type: object
 */
router.get('/health', (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    
    // Set appropriate HTTP status based on health
    let httpStatus = 200;
    if (healthStatus.status === 'degraded') {
      httpStatus = 200; // Still operational
    } else if (healthStatus.status === 'unhealthy') {
      httpStatus = 503; // Service unavailable
    }
    
    res.status(httpStatus).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get application metrics
 *     description: Returns comprehensive application metrics (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics', auth.authenticateToken, (req, res) => {
  try {
    const metrics = getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Metrics retrieval failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics'
    });
  }
});

/**
 * @swagger
 * /api/monitoring/cache:
 *   get:
 *     summary: Get cache statistics
 *     description: Returns cache performance statistics (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 */
router.get('/cache', auth.authenticateToken, (req, res) => {
  try {
    const cacheStats = getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    logger.error('Cache stats retrieval failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics'
    });
  }
});

/**
 * @swagger
 * /api/monitoring/cache/invalidate:
 *   post:
 *     summary: Invalidate cache
 *     description: Invalidate cache by pattern or all caches (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: Cache key pattern to invalidate
 *               duration:
 *                 type: string
 *                 enum: [short, medium, long, all]
 *                 description: Cache duration to target
 *               all:
 *                 type: boolean
 *                 description: Invalidate all caches
 *     responses:
 *       200:
 *         description: Cache invalidated successfully
 */
router.post('/cache/invalidate', auth.authenticateToken, (req, res) => {
  try {
    const { pattern, duration = 'all', all = false } = req.body;
    
    if (all) {
      invalidateCache.all();
      logger.info('All caches invalidated', { userId: req.user.id });
    } else if (pattern) {
      invalidateCache.pattern(pattern, duration);
      logger.info('Cache invalidated by pattern', { 
        pattern, 
        duration, 
        userId: req.user.id 
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either pattern or all=true must be specified'
      });
    }
    
    res.json({
      success: true,
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache invalidation failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache'
    });
  }
});

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: Get active alerts
 *     description: Returns current system alerts (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */
router.get('/alerts', auth.authenticateToken, (req, res) => {
  try {
    const activeAlerts = alerts.check();
    
    res.json({
      success: true,
      data: {
        alerts: activeAlerts,
        count: activeAlerts.length,
        timestamp: new Date().toISOString(),
        thresholds: alerts.thresholds
      }
    });
  } catch (error) {
    logger.error('Alerts retrieval failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts'
    });
  }
});

/**
 * @swagger
 * /api/monitoring/logs:
 *   get:
 *     summary: Get recent logs
 *     description: Returns recent application logs (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Log level filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 */
router.get('/logs', auth.authenticateToken, (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // This is a placeholder - in a real implementation, you'd read from log files
    // or use a log aggregation service
    res.json({
      success: true,
      message: 'Log retrieval not implemented yet',
      data: {
        logs: [],
        filters: { level, limit },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Logs retrieval failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs'
    });
  }
});

/**
 * @swagger
 * /api/monitoring/system:
 *   get:
 *     summary: Get system information
 *     description: Returns detailed system information (requires authentication)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 */
router.get('/system', auth.authenticateToken, (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        cwd: process.cwd()
      },
      os: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    logger.error('System info retrieval failed', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information'
    });
  }
});

module.exports = router;