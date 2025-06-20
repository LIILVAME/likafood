const express = require('express');
const mongoose = require('mongoose');
const { healthMetrics } = require('../middleware/monitoring');
const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 uptime:
 *                   type: number
 *                   example: 3600000
 *                 metrics:
 *                   type: object
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system metrics
    const metrics = healthMetrics.getStats();
    
    // Determine overall health status
    const isHealthy = dbStatus === 'connected' && parseFloat(metrics.errorRate) < 10;
    
    if (!isHealthy) {
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        metrics,
        message: dbStatus === 'disconnected' ? 'Database connection failed' : 'High error rate detected'
      });
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: metrics.uptime,
      metrics: {
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        errorRate: metrics.errorRate,
        memoryUsage: {
          used: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        }
      }
    });
  } catch (error) {
    healthMetrics.incrementError(error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with full metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get('/detailed', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const metrics = healthMetrics.getStats();
    
    res.json({
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      server: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      metrics
    });
  } catch (error) {
    healthMetrics.incrementError(error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// @route   GET /api/health/ping
// @desc    Simple ping endpoint
// @access  Public
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong! 🏓',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/health/database
// @desc    Database-specific health check
// @access  Public
router.get('/database', (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    
    if (dbStatus.status === 'connected') {
      res.json({
        success: true,
        message: 'Database connection is healthy! 💾',
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available',
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;