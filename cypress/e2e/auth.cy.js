describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanDatabase();
    cy.visit('/');
  });

  describe('Login Process', () => {
    it('should redirect to login page when not authenticated', () => {
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
    });

    it('should show validation errors for invalid phone number', () => {
      cy.visit('/login');
      
      // Test empty phone number
      cy.get('[data-testid="send-otp-button"]').click();
      cy.get('[data-testid="phone-error"]').should('contain', 'Phone number is required');
      
      // Test invalid phone number format
      cy.get('[data-testid="phone-input"]').type('invalid-phone');
      cy.get('[data-testid="send-otp-button"]').click();
      cy.get('[data-testid="phone-error"]').should('contain', 'Please enter a valid phone number');
    });

    it('should send OTP for valid phone number', () => {
      cy.visit('/login');
      
      // Intercept OTP request
      cy.intercept('POST', '/api/auth/send-otp', {
        statusCode: 200,
        body: {
          success: true,
          message: 'OTP sent successfully'
        }
      }).as('sendOTP');
      
      // Enter valid phone number
      cy.get('[data-testid="phone-input"]').type('+1234567890');
      cy.get('[data-testid="send-otp-button"]').click();
      
      // Wait for API call
      cy.wait('@sendOTP');
      
      // Check OTP input appears
      cy.get('[data-testid="otp-input"]').should('be.visible');
      cy.get('[data-testid="otp-instructions"]').should('contain', 'Enter the 6-digit code');
    });

    it('should verify OTP and login successfully', () => {
      cy.visit('/login');
      
      // Mock OTP send
      cy.intercept('POST', '/api/auth/send-otp', {
        statusCode: 200,
        body: { success: true, message: 'OTP sent successfully' }
      }).as('sendOTP');
      
      // Mock OTP verify
      cy.intercept('POST', '/api/auth/verify-otp', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: '123',
              phoneNumber: '+1234567890',
              businessName: 'Test Restaurant',
              isVerified: true
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token'
          }
        }
      }).as('verifyOTP');
      
      // Complete login flow
      cy.get('[data-testid="phone-input"]').type('+1234567890');
      cy.get('[data-testid="send-otp-button"]').click();
      cy.wait('@sendOTP');
      
      cy.get('[data-testid="otp-input"]').type('123456');
      cy.get('[data-testid="verify-otp-button"]').click();
      cy.wait('@verifyOTP');
      
      // Should redirect to dashboard
      cy.url().should('not.include', '/login');
      cy.url().should('include', '/home');
      
      // Should store token in localStorage
      cy.window().its('localStorage.token').should('exist');
    });

    it('should show error for invalid OTP', () => {
      cy.visit('/login');
      
      // Mock OTP send
      cy.intercept('POST', '/api/auth/send-otp', {
        statusCode: 200,
        body: { success: true, message: 'OTP sent successfully' }
      }).as('sendOTP');
      
      // Mock invalid OTP verify
      cy.intercept('POST', '/api/auth/verify-otp', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Invalid or expired OTP'
        }
      }).as('verifyOTPError');
      
      // Enter phone and get OTP input
      cy.get('[data-testid="phone-input"]').type('+1234567890');
      cy.get('[data-testid="send-otp-button"]').click();
      cy.wait('@sendOTP');
      
      // Enter invalid OTP
      cy.get('[data-testid="otp-input"]').type('000000');
      cy.get('[data-testid="verify-otp-button"]').click();
      cy.wait('@verifyOTPError');
      
      // Should show error message
      cy.get('[data-testid="otp-error"]').should('contain', 'Invalid or expired OTP');
      cy.url().should('include', '/login');
    });
  });

  describe('Registration Process', () => {
    it('should allow new user registration', () => {
      cy.visit('/login');
      
      // Mock registration flow
      cy.intercept('POST', '/api/auth/send-otp', {
        statusCode: 200,
        body: { success: true, message: 'OTP sent successfully' }
      }).as('sendOTP');
      
      cy.intercept('POST', '/api/auth/verify-otp', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: '123',
              phoneNumber: '+1234567890',
              businessName: null,
              isVerified: true
            },
            token: 'mock-jwt-token',
            isNewUser: true
          }
        }
      }).as('verifyOTPNewUser');
      
      // Complete OTP verification
      cy.get('[data-testid="phone-input"]').type('+1234567890');
      cy.get('[data-testid="send-otp-button"]').click();
      cy.wait('@sendOTP');
      
      cy.get('[data-testid="otp-input"]').type('123456');
      cy.get('[data-testid="verify-otp-button"]').click();
      cy.wait('@verifyOTPNewUser');
      
      // Should show business name setup
      cy.get('[data-testid="business-name-input"]').should('be.visible');
      cy.get('[data-testid="business-name-input"]').type('My Test Restaurant');
      
      // Mock business name update
      cy.intercept('PUT', '/api/auth/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: '123',
              phoneNumber: '+1234567890',
              businessName: 'My Test Restaurant',
              isVerified: true
            }
          }
        }
      }).as('updateProfile');
      
      cy.get('[data-testid="complete-registration-button"]').click();
      cy.wait('@updateProfile');
      
      // Should redirect to dashboard
      cy.url().should('include', '/home');
    });
  });

  describe('Logout Process', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-jwt-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: '123',
          phoneNumber: '+1234567890',
          businessName: 'Test Restaurant'
        }));
      });
    });

    it('should logout successfully', () => {
      cy.visit('/home');
      
      // Click logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Should clear localStorage
      cy.window().its('localStorage.token').should('not.exist');
      cy.window().its('localStorage.user').should('not.exist');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected routes without auth', () => {
      const protectedRoutes = ['/home', '/catalog', '/orders', '/expenses', '/settings'];
      
      protectedRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should allow access to protected routes when authenticated', () => {
      // Set auth token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'mock-jwt-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: '123',
          phoneNumber: '+1234567890',
          businessName: 'Test Restaurant'
        }));
      });
      
      const protectedRoutes = ['/home', '/catalog', '/orders', '/expenses', '/settings'];
      
      protectedRoutes.forEach((route) => {
        cy.visit(route);
        cy.url().should('include', route);
        cy.url().should('not.include', '/login');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login');
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      cy.visit('/login');
      
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="phone-input"]').should('be.visible');
      cy.get('[data-testid="send-otp-button"]').should('be.visible');
    });
  });
});