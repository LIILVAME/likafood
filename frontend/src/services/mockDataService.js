class MockDataService {
  constructor() {
    this.mockUser = {
      id: '1',
      phoneNumber: '+1234567890',
      businessName: 'Mama Sarah\'s Kitchen',
      ownerName: 'Sarah Johnson',
      token: 'mock_token_123',
      businessHours: {
        open: '08:00',
        close: '20:00'
      },
      location: 'Downtown Market'
    };

    this.mockDishes = [
      {
        id: '1',
        name: 'Jollof Rice',
        price: 15.00,
        category: 'Main Course',
        description: 'Spicy West African rice dish',
        available: true,
        preparationTime: 20
      },
      {
        id: '2',
        name: 'Grilled Chicken',
        price: 12.00,
        category: 'Main Course',
        description: 'Perfectly seasoned grilled chicken',
        available: true,
        preparationTime: 15
      },
      {
        id: '3',
        name: 'Plantain',
        price: 5.00,
        category: 'Side Dish',
        description: 'Sweet fried plantain',
        available: true,
        preparationTime: 10
      }
    ];

    this.mockOrders = [
      {
        id: '1',
        customerPhone: '+1234567891',
        customerName: 'John Doe',
        items: [
          { dishId: '1', quantity: 2, price: 15.00 },
          { dishId: '3', quantity: 1, price: 5.00 }
        ],
        total: 35.00,
        status: 'pending',
        orderTime: new Date().toISOString(),
        estimatedReady: new Date(Date.now() + 20 * 60000).toISOString()
      },
      {
        id: '2',
        customerPhone: '+1234567892',
        customerName: 'Jane Smith',
        items: [
          { dishId: '2', quantity: 1, price: 12.00 }
        ],
        total: 12.00,
        status: 'ready',
        orderTime: new Date(Date.now() - 15 * 60000).toISOString(),
        estimatedReady: new Date().toISOString()
      }
    ];

    this.mockExpenses = [
      {
        id: '1',
        description: 'Rice and spices',
        amount: 50.00,
        category: 'Ingredients',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: '2',
        description: 'Gas refill',
        amount: 25.00,
        category: 'Utilities',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
      }
    ];

    this.mockMetrics = {
      todayOrders: 8,
      todaySales: 180.00,
      todayProfit: 90.00,
      pendingOrders: 3
    };
  }

  async handleRequest(method, url, data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = { data: null, status: 200 };

    switch (true) {
      case url.includes('/auth/request-otp'):
        response.data = { message: 'OTP sent successfully' };
        break;

      case url.includes('/auth/verify-otp'):
        if (data.otp === '1234') {
          response.data = this.mockUser;
        } else {
          throw new Error('Invalid OTP');
        }
        break;

      case url.includes('/dishes') && method === 'GET':
        response.data = this.mockDishes;
        break;

      case url.includes('/dishes') && method === 'POST':
        const newDish = {
          id: Date.now().toString(),
          ...data,
          available: true
        };
        this.mockDishes.push(newDish);
        response.data = newDish;
        break;

      case url.includes('/dishes') && method === 'PUT':
        const dishId = url.split('/').pop();
        const dishIndex = this.mockDishes.findIndex(d => d.id === dishId);
        if (dishIndex !== -1) {
          this.mockDishes[dishIndex] = { ...this.mockDishes[dishIndex], ...data };
          response.data = this.mockDishes[dishIndex];
        }
        break;

      case url.includes('/dishes') && method === 'DELETE':
        const deleteId = url.split('/').pop();
        this.mockDishes = this.mockDishes.filter(d => d.id !== deleteId);
        response.data = { message: 'Dish deleted successfully' };
        break;

      case url.includes('/orders') && method === 'GET':
        response.data = this.mockOrders;
        break;

      case url.includes('/orders') && method === 'POST':
        const newOrder = {
          id: Date.now().toString(),
          ...data,
          status: 'pending',
          orderTime: new Date().toISOString()
        };
        this.mockOrders.push(newOrder);
        response.data = newOrder;
        break;

      case url.includes('/orders') && method === 'PUT':
        const orderId = url.split('/').pop();
        const orderIndex = this.mockOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          this.mockOrders[orderIndex] = { ...this.mockOrders[orderIndex], ...data };
          response.data = this.mockOrders[orderIndex];
        }
        break;

      case url.includes('/expenses') && method === 'GET':
        response.data = this.mockExpenses;
        break;

      case url.includes('/expenses') && method === 'POST':
        const newExpense = {
          id: Date.now().toString(),
          ...data,
          date: data.date || new Date().toISOString().split('T')[0]
        };
        this.mockExpenses.push(newExpense);
        response.data = newExpense;
        break;

      case url.includes('/metrics'):
        response.data = this.mockMetrics;
        break;

      default:
        throw new Error('Endpoint not found');
    }

    return response;
  }
}

export const mockDataService = new MockDataService();