const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { category, startDate, endDate, limit = 50, page = 1 } = req.query;
    const userId = req.user.id;
    
    // Build query
    let query = { user: userId };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Expense.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses'
    });
  }
});

// Get expense by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    logger.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense'
    });
  }
});

// Create new expense
router.post('/', [
  auth,
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description is required and must be less than 200 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn(['ingredients', 'utilities', 'equipment', 'transport', 'marketing', 'rent', 'staff', 'other']).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('recurring.enabled').optional().isBoolean().withMessage('Recurring enabled must be boolean'),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid recurring frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const expenseData = {
      ...req.body,
      user: req.user.id
    };
    
    const expense = new Expense(expenseData);
    await expense.save();
    
    logger.info(`Expense created: ${expense._id} by user ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    logger.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense'
    });
  }
});

// Update expense
router.put('/:id', [
  auth,
  body('description').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Description must be less than 200 characters'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isIn(['ingredients', 'utilities', 'equipment', 'transport', 'marketing', 'rent', 'staff', 'other']).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('recurring.enabled').optional().isBoolean().withMessage('Recurring enabled must be boolean'),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid recurring frequency')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    logger.info(`Expense updated: ${expense._id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    logger.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense'
    });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    logger.info(`Expense deleted: ${req.params.id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense'
    });
  }
});

// Get expense statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const userId = req.user.id;
    
    let matchQuery = { user: userId };
    
    if (category && category !== 'all') {
      matchQuery.category = category;
    }
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) {
        matchQuery.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.date.$lte = new Date(endDate);
      }
    }
    
    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);
    
    const categoryStats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalAmount: 0,
          count: 0,
          avgAmount: 0,
          maxAmount: 0,
          minAmount: 0
        },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    logger.error('Error fetching expense statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense statistics'
    });
  }
});

module.exports = router;