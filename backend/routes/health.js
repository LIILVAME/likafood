const express = require('express');
const { getConnectionStatus } = require('../config/database');
const logger = require('../utils/logger');
const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    
    // Calculate uptime in human readable format
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);
    const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
    };
    
    const healthData = {
      success: true,
      message: 'LikaFood Backend API is healthy! 🚀',
      timestamp,
      server: {
        status: 'running',
        uptime: uptimeFormatted,
        uptimeSeconds: Math.floor(uptime),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: dbStatus.status,
        host: dbStatus.host || 'not connected',
        name: dbStatus.name || 'not connected',
        port: dbStatus.port || 'not connected'
      },
      memory: {
        usage: memoryMB,
        unit: 'MB'
      },
      api: {
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          root: '/'
        }
      }
    };
    
    // Set appropriate status code based on database connection
    const statusCode = dbStatus.status === 'connected' ? 200 : 206; // 206 = Partial Content
    
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check error:', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      server: {
        status: 'error'
      }
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