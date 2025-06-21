const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create cache instances with different TTL settings
const caches = {
  // Short-term cache for frequently accessed data (5 minutes)
  short: new NodeCache({ stdTTL: 300, checkperiod: 60 }),
  
  // Medium-term cache for semi-static data (30 minutes)
  medium: new NodeCache({ stdTTL: 1800, checkperiod: 300 }),
  
  // Long-term cache for static data (2 hours)
  long: new NodeCache({ stdTTL: 7200, checkperiod: 600 })
};

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Log cache events
Object.values(caches).forEach((cache, index) => {
  const cacheNames = ['short', 'medium', 'long'];
  const cacheName = cacheNames[index];
  
  cache.on('set', (key, value) => {
    stats.sets++;
    logger.debug(`Cache SET [${cacheName}]`, { key, size: JSON.stringify(value).length });
  });
  
  cache.on('del', (key, value) => {
    stats.deletes++;
    logger.debug(`Cache DELETE [${cacheName}]`, { key });
  });
  
  cache.on('expired', (key, value) => {
    logger.debug(`Cache EXPIRED [${cacheName}]`, { key });
  });
});

// Generate cache key from request
const generateCacheKey = (req, customKey = null) => {
  if (customKey) {
    return customKey;
  }
  
  const userId = req.user ? req.user.id : 'anonymous';
  const method = req.method;
  const path = req.route ? req.route.path : req.path;
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  
  return `${method}:${path}:${query}:${params}:${userId}`;
};

// Cache middleware factory
const createCacheMiddleware = (duration = 'short', options = {}) => {
  const {
    keyGenerator = generateCacheKey,
    skipCache = () => false,
    skipCacheOnError = true,
    customTTL = null
  } = options;
  
  return (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }
    
    const cache = caches[duration] || caches.short;
    const cacheKey = keyGenerator(req);
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      stats.hits++;
      logger.debug('Cache HIT', {
        key: cacheKey,
        duration,
        requestId: req.id
      });
      
      // Set cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      
      return res.json(cachedData);
    }
    
    stats.misses++;
    logger.debug('Cache MISS', {
      key: cacheKey,
      duration,
      requestId: req.id
    });
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const ttl = customTTL || cache.options.stdTTL;
          cache.set(cacheKey, data, ttl);
          
          logger.debug('Cache SET', {
            key: cacheKey,
            duration,
            ttl,
            size: JSON.stringify(data).length,
            requestId: req.id
          });
        } catch (error) {
          if (!skipCacheOnError) {
            logger.error('Cache SET failed', {
              key: cacheKey,
              error: error.message,
              requestId: req.id
            });
          }
        }
      }
      
      // Set cache headers
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Predefined cache middlewares
const cacheMiddlewares = {
  // For frequently changing data (user-specific)
  short: createCacheMiddleware('short'),
  
  // For semi-static data (dishes, categories)
  medium: createCacheMiddleware('medium'),
  
  // For static data (settings, configurations)
  long: createCacheMiddleware('long'),
  
  // Custom cache for specific use cases
  dishes: createCacheMiddleware('medium', {
    keyGenerator: (req) => {
      const query = JSON.stringify(req.query);
      return `dishes:${query}`;
    }
  }),
  
  dashboard: createCacheMiddleware('short', {
    keyGenerator: (req) => {
      const userId = req.user ? req.user.id : 'anonymous';
      const dateRange = req.query.startDate && req.query.endDate 
        ? `${req.query.startDate}-${req.query.endDate}` 
        : 'default';
      return `dashboard:${userId}:${dateRange}`;
    }
  }),
  
  orders: createCacheMiddleware('short', {
    keyGenerator: (req) => {
      const userId = req.user ? req.user.id : 'anonymous';
      const query = JSON.stringify(req.query);
      return `orders:${userId}:${query}`;
    }
  })
};

// Cache invalidation helpers
const invalidateCache = {
  // Invalidate all caches
  all: () => {
    Object.values(caches).forEach(cache => cache.flushAll());
    logger.info('All caches invalidated');
  },
  
  // Invalidate by pattern
  pattern: (pattern, duration = 'all') => {
    const cachesToClear = duration === 'all' ? Object.values(caches) : [caches[duration]];
    
    cachesToClear.forEach(cache => {
      const keys = cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      matchingKeys.forEach(key => {
        cache.del(key);
      });
      
      logger.info('Cache invalidated by pattern', {
        pattern,
        keysDeleted: matchingKeys.length,
        duration
      });
    });
  },
  
  // Specific invalidations
  dishes: () => invalidateCache.pattern('dishes'),
  orders: () => invalidateCache.pattern('orders'),
  dashboard: () => invalidateCache.pattern('dashboard'),
  user: (userId) => invalidateCache.pattern(userId)
};

// Cache statistics endpoint data
const getCacheStats = () => {
  const cacheStats = {};
  
  Object.entries(caches).forEach(([name, cache]) => {
    cacheStats[name] = {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      ksize: cache.getStats().ksize,
      vsize: cache.getStats().vsize
    };
  });
  
  return {
    ...stats,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    caches: cacheStats,
    uptime: process.uptime()
  };
};

// Middleware to add cache control headers
const cacheControl = (maxAge = 300, options = {}) => {
  const {
    public: isPublic = true,
    mustRevalidate = false,
    noStore = false,
    noCache = false
  } = options;
  
  return (req, res, next) => {
    if (noStore) {
      res.setHeader('Cache-Control', 'no-store');
    } else if (noCache) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      const directives = [];
      
      if (isPublic) {
        directives.push('public');
      } else {
        directives.push('private');
      }
      
      directives.push(`max-age=${maxAge}`);
      
      if (mustRevalidate) {
        directives.push('must-revalidate');
      }
      
      res.setHeader('Cache-Control', directives.join(', '));
    }
    
    next();
  };
};

// Clear all caches for testing
const clearCache = () => {
  Object.values(caches).forEach(cache => {
    cache.flushAll();
  });
  
  // Reset stats
  stats.hits = 0;
  stats.misses = 0;
  stats.sets = 0;
  stats.deletes = 0;
};

// Main cache middleware function
const cacheMiddleware = (duration = 'short', customKey = null, options = {}) => {
  return cacheMiddlewares[duration] || createCacheMiddleware(duration, customKey, options);
};

module.exports = {
  cacheMiddleware,
  cacheMiddlewares,
  createCacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearCache,
  cacheControl,
  caches
};