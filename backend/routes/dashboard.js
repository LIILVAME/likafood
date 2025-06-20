const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    // For now, return mock data. In a real application, this would fetch data from the database.
    const mockMetrics = {
      todayOrders: 12,
      todaySales: 45000,
      todayProfit: 15000,
      pendingOrders: 3,
      totalDishes: 25
    };
    
    const mockOrders = [
      {
        id: '1',
        customerName: 'Jean Dupont',
        items: ['Thieboudienne', 'Bissap'],
        total: 3500,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        customerName: 'Marie Diallo',
        items: ['Yassa Poulet'],
        total: 2800,
        status: 'preparing',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        customerName: 'Amadou Ba',
        items: ['Mafé', 'Attaya'],
        total: 4200,
        status: 'ready',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ];

    res.json({ metrics: mockMetrics, orders: mockOrders });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;