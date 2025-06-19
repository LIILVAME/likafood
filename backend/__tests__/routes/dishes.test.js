const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Dish = require('../../models/Dish');
const dishesRoutes = require('../../routes/dishes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/dishes', dishesRoutes);

// Helper function to create JWT token
const createToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Dishes Routes - Input Validation', () => {
  let testUser;
  let authToken;
  let testDish;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      phoneNumber: '+33123456789',
      businessName: 'Test Restaurant',
      ownerName: 'Test Owner',
      email: 'test@example.com',
      businessType: 'restaurant',
      isPhoneVerified: true
    });
    await testUser.save();

    // Create auth token
    authToken = createToken(testUser._id);

    // Create test dish
    testDish = new Dish({
      name: 'Test Dish',
      description: 'A delicious test dish',
      price: 15.99,
      category: 'main',
      isAvailable: true,
      ingredients: ['ingredient1', 'ingredient2'],
      allergens: ['gluten'],
      preparationTime: 30,
      imageUrl: 'https://example.com/image.jpg'
    });
    await testDish.save();
  });

  describe('GET /api/dishes', () => {
    it('should return all dishes successfully', async () => {
      const response = await request(app)
        .get('/api/dishes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.dishes)).toBe(true);
    });

    it('should return empty array when no dishes exist', async () => {
      // Clear all dishes
      await Dish.deleteMany({});

      const response = await request(app)
        .get('/api/dishes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dishes).toHaveLength(0);
    });
  });

  describe('POST /api/dishes', () => {
    const validDishData = {
      name: 'New Dish',
      description: 'A new delicious dish',
      price: 12.50,
      category: 'appetizer',
      isAvailable: true,
      ingredients: ['tomato', 'cheese'],
      allergens: ['dairy'],
      preparationTime: 20,
      imageUrl: 'https://example.com/new-image.jpg'
    };

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/api/dishes')
        .send(validDishData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'Incomplete Dish'
        // Missing required fields like price, category
      };

      const response = await request(app)
        .post('/api/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid price', async () => {
      const invalidData = {
        ...validDishData,
        price: -5 // Invalid negative price
      };

      const response = await request(app)
        .post('/api/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid category', async () => {
      const invalidData = {
        ...validDishData,
        category: 'invalid-category'
      };

      const response = await request(app)
        .post('/api/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/dishes/:id', () => {
    const updateData = {
      name: 'Updated Dish',
      price: 18.99,
      isAvailable: false
    };

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .put(`/api/dishes/${testDish._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent dish', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/dishes/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid dish ID', async () => {
      const response = await request(app)
        .put('/api/dishes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid price in update', async () => {
      const invalidUpdate = {
        ...updateData,
        price: -10
      };

      const response = await request(app)
        .put(`/api/dishes/${testDish._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/dishes/:id', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .delete(`/api/dishes/${testDish._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent dish', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/dishes/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid dish ID', async () => {
      const response = await request(app)
        .delete('/api/dishes/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});