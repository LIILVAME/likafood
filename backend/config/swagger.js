const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LikaFood API',
      version: '1.0.0',
      description: 'API documentation for LikaFood MVP - Restaurant Management System',
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
        url: process.env.API_BASE_URL || 'http://localhost:5001',
        description: 'Development server'
      },
      {
        url: 'https://api.likafood.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['phoneNumber', 'businessName', 'ownerName'],
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier'
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number (international format)',
              example: '+33123456789'
            },
            businessName: {
              type: 'string',
              description: 'Name of the business/restaurant',
              example: 'Restaurant Le Délice'
            },
            ownerName: {
              type: 'string',
              description: 'Name of the business owner',
              example: 'Jean Dupont'
            },
            isPhoneVerified: {
              type: 'boolean',
              description: 'Whether the phone number is verified',
              default: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        OTP: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'Phone number associated with OTP',
              example: '+33123456789'
            },
            code: {
              type: 'string',
              description: 'OTP code (6 digits)',
              example: '123456'
            },
            type: {
              type: 'string',
              enum: ['registration', 'login'],
              description: 'Type of OTP verification'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'OTP expiration timestamp'
            },
            isUsed: {
              type: 'boolean',
              description: 'Whether the OTP has been used',
              default: false
            }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Dish: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique dish identifier'
            },
            name: {
              type: 'string',
              description: 'Name of the dish',
              example: 'Poulet Yassa'
            },
            description: {
              type: 'string',
              description: 'Description of the dish',
              example: 'Plat traditionnel sénégalais au poulet mariné'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Price of the dish',
              example: 15.99
            },
            category: {
              type: 'string',
              description: 'Category of the dish',
              example: 'Plats principaux'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Whether the dish is currently available',
              default: true
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of ingredients'
            },
            allergens: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of allergens'
            },
            preparationTime: {
              type: 'integer',
              description: 'Preparation time in minutes',
              example: 30
            },
            imageUrl: {
              type: 'string',
              description: 'URL of the dish image'
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
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code for client handling'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field that caused the error'
                  },
                  message: {
                    type: 'string',
                    description: 'Field-specific error message'
                  }
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
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
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};