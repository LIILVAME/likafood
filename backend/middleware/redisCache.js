const redis = require('redis');
const logger = require('../utils/logger');

// Redis client configuration
let redisClient = null;
let isRedisConnected = false;

// Initialize Redis client
const initializeRedis = async () => {
  try {
    // Use Redis URL from environment or default to local Redis
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection refused, falling back to in-memory cache');
          return undefined; // Don't retry
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return undefined;
        }
        if (options.attempt > 3) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis client error:', { error: err.message });
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isRedisConnected = true;
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      isRedisConnected = false;
    });

    await redisClient.connect();
    logger.info('✅ Redis cache initialized successfully');
    
  } catch (error) {
    logger.warn('Redis initialization failed, continuing without Redis cache:', { error: error.message });
    isRedisConnected = false;
  }
};

// Cache operations with fallback to in-memory
const cache = {
  // Get value from cache
  async get(key) {
    try {
      if (isRedisConnected && redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
      return null;
    } catch (error) {
      logger.warn('Redis GET error:', { key, error: error.message });
      return null;
    }
  },

  // Set value in cache with TTL
  async set(key, value, ttlSeconds = 300) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        logger.debug('Redis SET:', { key, ttl: ttlSeconds });
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Redis SET error:', { key, error: error.message });
      return false;
    }
  },

  // Delete value from cache
  async del(key) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
        logger.debug('Redis DELETE:', { key });
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Redis DELETE error:', { key, error: error.message });
      return false;
    }
  },

  // Clear all cache
  async clear() {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.flushAll();
        logger.info('Redis cache cleared');
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Redis CLEAR error:', { error: error.message });
      return false;
    }
  },

  // Get cache statistics
  async getStats() {
    try {
      if (isRedisConnected && redisClient) {
        const info = await redisClient.info('stats');
        return {
          connected: isRedisConnected,
          info: info
        };
      }
      return { connected: false };
    } catch (error) {
      logger.warn('Redis STATS error:', { error: error.message });
      return { connected: false, error: error.message };
    }
  }
};

// Redis cache middleware for Express routes
const redisCacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = `api:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Redis cache HIT:', { key: cacheKey });
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      logger.debug('Redis cache MISS:', { key: cacheKey });
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, ttlSeconds).catch(err => {
            logger.warn('Failed to cache response:', { key: cacheKey, error: err.message });
          });
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.warn('Redis cache middleware error:', { error: error.message });
      next();
    }
  };
};

// Cache invalidation helpers
const invalidatePatterns = {
  // Invalidate all dishes cache
  async dishes() {
    try {
      if (isRedisConnected && redisClient) {
        const keys = await redisClient.keys('api:*dishes*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info('Invalidated dishes cache:', { count: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate dishes cache:', { error: error.message });
    }
  },

  // Invalidate all orders cache
  async orders() {
    try {
      if (isRedisConnected && redisClient) {
        const keys = await redisClient.keys('api:*orders*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info('Invalidated orders cache:', { count: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate orders cache:', { error: error.message });
    }
  },

  // Invalidate user-specific cache
  async user(userId) {
    try {
      if (isRedisConnected && redisClient) {
        const keys = await redisClient.keys(`api:*:${userId}`);
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info('Invalidated user cache:', { userId, count: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', { userId, error: error.message });
    }
  }
};

// Graceful shutdown
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.warn('Error closing Redis connection:', { error: error.message });
  }
};

module.exports = {
  initializeRedis,
  cache,
  redisCacheMiddleware,
  invalidatePatterns,
  closeRedis,
  isConnected: () => isRedisConnected
};