const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Expense = require('../models/Expense');
const logger = require('../utils/logger');

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get pending orders
    const pendingOrders = await Order.countDocuments({
      userId,
      status: 'pending'
    });

    // Get total dishes
    const totalDishes = await Dish.countDocuments({ userId });

    // Get today's expenses
    const todayExpenses = await Expense.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const todayExpenseTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate today's metrics
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const todayProfit = todaySales - todayExpenseTotal; // Real profit = sales - expenses

    const metrics = {
      todayOrders: todayOrders.length,
      todaySales,
      todayExpenses: todayExpenseTotal,
      todayProfit,
      pendingOrders,
      totalDishes
    };

    // Get recent orders (last 10)
    const recentOrders = await Order.find({ userId })
      .populate('items.dishId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customerName items total status createdAt');

    // Format orders for frontend
    const formattedOrders = recentOrders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items.map(item => item.name),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    }));

    res.json({ 
      success: true,
      metrics, 
      orders: formattedOrders 
    });
  } catch (err) {
    logger.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du tableau de bord'
    });
  }
});

module.exports = router;