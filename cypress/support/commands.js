// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (phoneNumber, otp = '123456') => {
  cy.visit('/login');
  
  // Enter phone number
  cy.get('[data-testid="phone-input"]').type(phoneNumber);
  cy.get('[data-testid="send-otp-button"]').click();
  
  // Wait for OTP input to appear
  cy.get('[data-testid="otp-input"]').should('be.visible');
  
  // Enter OTP
  cy.get('[data-testid="otp-input"]').type(otp);
  cy.get('[data-testid="verify-otp-button"]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.window().its('localStorage.token').should('exist');
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Custom command for creating a test dish
Cypress.Commands.add('createDish', (dishData) => {
  const defaultDish = {
    name: 'Test Dish',
    description: 'A delicious test dish',
    price: 15.99,
    category: 'Main Course',
    ...dishData
  };
  
  cy.visit('/catalog');
  cy.get('[data-testid="add-dish-button"]').click();
  
  // Fill form
  cy.get('[data-testid="dish-name-input"]').type(defaultDish.name);
  cy.get('[data-testid="dish-description-input"]').type(defaultDish.description);
  cy.get('[data-testid="dish-price-input"]').type(defaultDish.price.toString());
  cy.get('[data-testid="dish-category-select"]').select(defaultDish.category);
  
  // Submit form
  cy.get('[data-testid="save-dish-button"]').click();
  
  // Verify dish was created
  cy.get('[data-testid="dish-card"]').should('contain', defaultDish.name);
});

// Custom command for API requests with auth
Cypress.Commands.add('apiRequest', (method, url, body = null) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    
    return cy.request({
      method,
      url: `${Cypress.env('apiUrl')}${url}`,
      body,
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json'
      },
      failOnStatusCode: false
    });
  });
});

// Custom command for waiting for loading to finish
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Custom command for checking accessibility
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    violations.forEach((violation) => {
      cy.log(`Accessibility violation: ${violation.description}`);
      cy.log(`Help: ${violation.helpUrl}`);
    });
  });
});

// Custom command for mobile viewport testing
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE dimensions
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad dimensions
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop dimensions
});

// Custom command for taking screenshots with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Custom command for database cleanup (requires backend support)
Cypress.Commands.add('cleanDatabase', () => {
  cy.task('clearDatabase');
});

// Custom command for seeding test data
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedTestData');
});

// Override type command to be more reliable
Cypress.Commands.overwrite('type', (originalFn, element, text, options) => {
  return originalFn(element, text, { delay: 50, ...options });
});

// Add command to wait for network idle
Cypress.Commands.add('waitForNetworkIdle', (timeout = 5000) => {
  let requestCount = 0;
  
  cy.intercept('**', (req) => {
    requestCount++;
    req.continue((res) => {
      requestCount--;
    });
  });
  
  cy.waitUntil(() => requestCount === 0, {
    timeout,
    interval: 100,
    errorMsg: 'Network did not become idle within timeout'
  });
});