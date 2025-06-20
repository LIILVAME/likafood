const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LikaFood API',
      version: '1.0.0',
      description: 'API documentation for LikaFood MVP - Food Vendor Management System',
      contact: {
        name: 'LikaFood Team',
        email: 'support@likafood.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-api.onrender.com'
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['phoneNumber', 'businessName'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number (unique)',
              example: '+1234567890'
            },
            businessName: {
              type: 'string',
              description: 'Name of the food business',
              example: 'Mama Sarah\'s Kitchen'
            },
            isVerified: {
              type: 'boolean',
              description: 'Phone verification status',
              default: false
            }
          }
        },
        Dish: {
          type: 'object',
          required: ['name', 'price', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Dish ID'
            },
            name: {
              type: 'string',
              description: 'Name of the dish',
              example: 'Jollof Rice'
            },
            description: {
              type: 'string',
              description: 'Description of the dish'
            },
            price: {
              type: 'number',
              description: 'Price of the dish',
              example: 15.99
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Availability status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};