class MockDataService {
  constructor() {
    this.mockUsers = [
      {
        id: '1',
        phoneNumber: '+33123456789',
        businessName: 'Restaurant Test',
        ownerName: 'John Doe',
        token: 'mock-jwt-token',
        createdAt: new Date().toISOString()
      }
    ];

    this.mockDishes = [
      {
        id: '1',
        name: 'Thieboudienne',
        price: 2500,
        description: 'Plat traditionnel sénégalais',
        category: 'Plat principal',
        available: true,
        preparationTime: 30
      },
      {
        id: '2',
        name: 'Yassa Poulet',
        price: 2000,
        description: 'Poulet à la sauce yassa',
        category: 'Plat principal',
        available: true,
        preparationTime: 25
      }
    ];

    this.mockOrders = [
      {
        id: '1',
        customerName: 'Client Test',
        customerPhone: '+33987654321',
        items: [
          { dishId: '1', quantity: 2, price: 2500 }
        ],
        total: 5000,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  }

  async handleRequest(method, url, data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const endpoint = url.replace('/api', '');

    switch (method.toUpperCase()) {
      case 'POST':
        return this.handlePost(endpoint, data);
      case 'GET':
        return this.handleGet(endpoint);
      case 'PUT':
      case 'PATCH':
        return this.handlePut(endpoint, data);
      case 'DELETE':
        return this.handleDelete(endpoint);
      default:
        throw new Error(`Method ${method} not supported`);
    }
  }

  handlePost(endpoint, data) {
    switch (endpoint) {
      case '/auth/login-or-register':
        return {
          data: {
            success: true,
            data: {
              action: 'login',
              message: 'OTP sent successfully'
            }
          }
        };

      case '/auth/verify-otp':
        if (data.code === '1234') {
          return {
            data: {
              success: true,
              user: this.mockUsers[0],
              token: 'mock-jwt-token'
            }
          };
        } else {
          throw new Error('Invalid OTP');
        }

      case '/dishes':
        const newDish = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString()
        };
        this.mockDishes.push(newDish);
        return { data: { success: true, dish: newDish } };

      case '/orders':
        const newOrder = {
          id: Date.now().toString(),
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        this.mockOrders.push(newOrder);
        return { data: { success: true, order: newOrder } };

      default:
        throw new Error(`Endpoint ${endpoint} not found`);
    }
  }

  handleGet(endpoint) {
    switch (endpoint) {
      case '/health':
        return {
          data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'LikaFood API (Mock)'
          }
        };

      case '/dishes':
        return {
          data: {
            success: true,
            dishes: this.mockDishes
          }
        };

      case '/orders':
        return {
          data: {
            success: true,
            orders: this.mockOrders
          }
        };

      case '/dashboard/stats':
        return {
          data: {
            success: true,
            stats: {
              totalOrders: this.mockOrders.length,
              totalRevenue: this.mockOrders.reduce((sum, order) => sum + order.total, 0),
              totalDishes: this.mockDishes.length,
              pendingOrders: this.mockOrders.filter(order => order.status === 'pending').length
            }
          }
        };

      default:
        throw new Error(`Endpoint ${endpoint} not found`);
    }
  }

  handlePut(endpoint, data) {
    if (endpoint.startsWith('/dishes/')) {
      const dishId = endpoint.split('/')[2];
      const dishIndex = this.mockDishes.findIndex(dish => dish.id === dishId);
      if (dishIndex !== -1) {
        this.mockDishes[dishIndex] = { ...this.mockDishes[dishIndex], ...data };
        return { data: { success: true, dish: this.mockDishes[dishIndex] } };
      }
    }

    if (endpoint.startsWith('/orders/')) {
      const orderId = endpoint.split('/')[2];
      const orderIndex = this.mockOrders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        this.mockOrders[orderIndex] = { ...this.mockOrders[orderIndex], ...data };
        return { data: { success: true, order: this.mockOrders[orderIndex] } };
      }
    }

    throw new Error(`Endpoint ${endpoint} not found`);
  }

  handleDelete(endpoint) {
    if (endpoint.startsWith('/dishes/')) {
      const dishId = endpoint.split('/')[2];
      const dishIndex = this.mockDishes.findIndex(dish => dish.id === dishId);
      if (dishIndex !== -1) {
        this.mockDishes.splice(dishIndex, 1);
        return { data: { success: true } };
      }
    }

    if (endpoint.startsWith('/orders/')) {
      const orderId = endpoint.split('/')[2];
      const orderIndex = this.mockOrders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        this.mockOrders.splice(orderIndex, 1);
        return { data: { success: true } };
      }
    }

    throw new Error(`Endpoint ${endpoint} not found`);
  }
}

export const mockDataService = new MockDataService();