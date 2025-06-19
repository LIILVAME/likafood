const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     summary: Get all dishes
 *     description: Retrieve a list of all available dishes
 *     tags: [Dishes]
 *     responses:
 *       200:
 *         description: List of dishes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Dish'
 *             example:
 *               success: true
 *               data:
 *                 - id: "507f1f77bcf86cd799439011"
 *                   name: "Poulet Yassa"
 *                   description: "Plat traditionnel sénégalais"
 *                   price: 15.99
 *                   category: "Plats principaux"
 *                   isAvailable: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const dishes = await Dish.find();
    res.json({
      success: true,
      data: dishes
    });
  } catch (error) {
    logger.error('Error fetching dishes:', { 
      error: error.message, 
      stack: error.stack,
      endpoint: 'GET /api/dishes'
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching dishes',
      code: 'DISHES_FETCH_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/dishes:
 *   post:
 *     summary: Create a new dish
 *     description: Create a new dish (requires authentication)
 *     tags: [Dishes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the dish
 *                 example: "Thieboudienne"
 *               description:
 *                 type: string
 *                 description: Description of the dish
 *                 example: "Riz au poisson, légumes et sauce tomate"
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price of the dish
 *                 example: 18.50
 *               category:
 *                 type: string
 *                 description: Category of the dish
 *                 example: "Plats principaux"
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the dish is available
 *                 default: true
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of ingredients
 *                 example: ["riz", "poisson", "légumes", "tomate"]
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of allergens
 *                 example: ["poisson"]
 *               preparationTime:
 *                 type: integer
 *                 description: Preparation time in minutes
 *                 example: 45
 *               imageUrl:
 *                 type: string
 *                 description: URL of the dish image
 *     responses:
 *       201:
 *         description: Dish created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Dish'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    res.status(201).json({
      success: true,
      data: dish
    });
  } catch (error) {
    logger.error('Error creating dish:', { 
      error: error.message, 
      stack: error.stack,
      endpoint: 'POST /api/dishes',
      dishData: req.body
    });
    res.status(400).json({
      success: false,
      message: 'Error creating dish',
      code: 'DISH_CREATE_ERROR'
    });
  }
});

// PUT /api/dishes/:id - Update a dish
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }
    
    res.json({
      success: true,
      data: dish
    });
  } catch (error) {
    logger.error('Error updating dish:', { 
      error: error.message, 
      stack: error.stack,
      endpoint: 'PUT /api/dishes/:id',
      dishId: req.params.id,
      updateData: req.body
    });
    res.status(400).json({
      success: false,
      message: 'Error updating dish',
      code: 'DISH_UPDATE_ERROR'
    });
  }
});

// DELETE /api/dishes/:id - Delete a dish
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting dish:', { 
      error: error.message, 
      stack: error.stack,
      endpoint: 'DELETE /api/dishes/:id',
      dishId: req.params.id
    });
    res.status(400).json({
      success: false,
      message: 'Error deleting dish',
      code: 'DISH_DELETE_ERROR'
    });
  }
});

module.exports = router;