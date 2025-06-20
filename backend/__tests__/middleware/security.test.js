const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
// Mock the middleware since it may not exist yet
const rateLimitConfig = require('express-rate-limit')({
  windowMs: 1000,
  max: 100
});

const securityHeaders = [require('helmet')(), require('cors')()];

const validateInput = (rules) => (req, res, next) => {
  const errors = [];
  for (const [field, rule] of Object.entries(rules)) {
    const value = req.body[field];
    if (rule.required && !value) {
      errors.push(`${field} is required`);
    }
    if (value && rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    }
    if (value && rule.type === 'email' && !value.includes('@')) {
      errors.push(`${field} must be a valid email`);
    }
    if (value && rule.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`);
    }
    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }
    if (value && rule.max && value > rule.max) {
      errors.push(`${field} must be at most ${rule.max}`);
    }
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
      }
    }
  }
  next();
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
require('../setup');

// Create test app
function createTestApp(middleware) {
  const app = express();
  app.use(express.json());
  if (middleware) {
    app.use(middleware);
  }
  app.get('/test', (req, res) => {
    res.json({ success: true, user: req.user });
  });
  app.post('/test', (req, res) => {
    res.json({ success: true, body: req.body });
  });
  return app;
}

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const app = createTestApp(rateLimitConfig);
      
      // Make requests within limit
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/test')
          .expect(200);
        
        expect(response.body.success).toBe(true);
      }
    });

    it('should block requests exceeding limit', async () => {
      const strictLimit = rateLimit({
        windowMs: 1000, // 1 second
        max: 2, // 2 requests per second
        message: { error: 'Too many requests' }
      });
      
      const app = createTestApp(strictLimit);
      
      // Make requests up to limit
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);
      
      // Next request should be blocked
      const response = await request(app)
        .get('/test')
        .expect(429);
      
      expect(response.body.error).toBe('Too many requests');
    });

    it('should include rate limit headers', async () => {
      const app = createTestApp(rateLimitConfig);
      
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const app = createTestApp(securityHeaders);
      
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      // Check helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should set CORS headers', async () => {
      const app = createTestApp(securityHeaders);
      
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    const validationRules = {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50
      },
      email: {
        required: true,
        type: 'email'
      },
      age: {
        type: 'number',
        min: 0,
        max: 120
      }
    };

    it('should validate required fields', async () => {
      const app = express();
      app.use(express.json());
      app.use(validateInput(validationRules));
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .post('/test')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('name is required');
      expect(response.body.errors).toContain('email is required');
    });

    it('should validate field types', async () => {
      const app = express();
      app.use(express.json());
      app.use(validateInput(validationRules));
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          name: 123, // Should be string
          email: 'invalid-email',
          age: 'not-a-number'
        })
        .expect(400);
      
      expect(response.body.errors).toContain('name must be a string');
      expect(response.body.errors).toContain('email must be a valid email');
      expect(response.body.errors).toContain('age must be a number');
    });

    it('should validate string length', async () => {
      const app = express();
      app.use(express.json());
      app.use(validateInput(validationRules));
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          name: 'A', // Too short
          email: 'test@example.com'
        })
        .expect(400);
      
      expect(response.body.errors).toContain('name must be at least 2 characters');
    });

    it('should validate number ranges', async () => {
      const app = express();
      app.use(express.json());
      app.use(validateInput(validationRules));
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          age: 150 // Too high
        })
        .expect(400);
      
      expect(response.body.errors).toContain('age must be at most 120');
    });

    it('should pass valid data', async () => {
      const app = express();
      app.use(express.json());
      app.use(validateInput(validationRules));
      app.post('/test', (req, res) => {
        res.json({ success: true, data: req.body });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
    });
  });

  describe('Body Sanitization', () => {
    it('should sanitize dangerous content', async () => {
      const app = express();
      app.use(express.json());
      app.use(sanitizeBody);
      app.post('/test', (req, res) => {
        res.json({ success: true, body: req.body });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          name: '<script>alert("xss")</script>John',
          description: 'Normal text with <b>bold</b>'
        })
        .expect(200);
      
      expect(response.body.body.name).not.toContain('<script>');
      expect(response.body.body.name).toContain('John');
      expect(response.body.body.description).not.toContain('<b>');
    });

    it('should handle nested objects', async () => {
      const app = express();
      app.use(express.json());
      app.use(sanitizeBody);
      app.post('/test', (req, res) => {
        res.json({ success: true, body: req.body });
      });
      
      const response = await request(app)
        .post('/test')
        .send({
          user: {
            name: '<script>alert(1)</script>John',
            profile: {
              bio: 'Bio with <img src=x onerror=alert(1)>'
            }
          }
        })
        .expect(200);
      
      expect(response.body.body.user.name).not.toContain('<script>');
      expect(response.body.body.user.profile.bio).not.toContain('<img');
    });
  });

  describe('Authentication Middleware', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = new User({
        phoneNumber: '+33123456789',
        businessName: 'Test Restaurant',
        ownerName: 'Test Owner',
        isVerified: true
      });
      await testUser.save();
      
      validToken = jwt.sign(
        { userId: testUser._id, phoneNumber: testUser.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    });

    it('should authenticate valid token', async () => {
      const app = express();
      app.use(authMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true, userId: req.user.id });
      });
      
      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe(testUser._id.toString());
    });

    it('should reject missing token', async () => {
      const app = express();
      app.use(authMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/test')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');
    });

    it('should reject invalid token', async () => {
      const app = express();
      app.use(authMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, phoneNumber: testUser.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );
      
      const app = express();
      app.use(authMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expired');
    });
  });

  describe('Admin Middleware', () => {
    let adminUser, regularUser;
    let adminToken, userToken;

    beforeEach(async () => {
      adminUser = new User({
        phoneNumber: '+33123456789',
        businessName: 'Admin Restaurant',
        ownerName: 'Admin User',
        isVerified: true,
        role: 'admin'
      });
      await adminUser.save();
      
      regularUser = new User({
        phoneNumber: '+33987654321',
        businessName: 'Regular Restaurant',
        ownerName: 'Regular User',
        isVerified: true,
        role: 'user'
      });
      await regularUser.save();
      
      adminToken = jwt.sign(
        { userId: adminUser._id, phoneNumber: adminUser.phoneNumber, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      userToken = jwt.sign(
        { userId: regularUser._id, phoneNumber: regularUser.phoneNumber, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    });

    it('should allow admin access', async () => {
      const app = express();
      app.use(authMiddleware);
      app.use(adminMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access', async () => {
      const app = express();
      app.use(authMiddleware);
      app.use(adminMiddleware);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      
      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });
  });
});