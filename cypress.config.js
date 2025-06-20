const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    env: {
      apiUrl: 'http://localhost:3001/api',
      testUser: {
        phoneNumber: '+1234567890',
        businessName: 'Test Restaurant'
      }
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Task for database cleanup
      on('task', {
        clearDatabase() {
          // Add database cleanup logic here
          return null;
        },
        
        seedTestData() {
          // Add test data seeding logic here
          return null;
        },
        
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      // Code coverage (if needed)
      // require('@cypress/code-coverage/task')(on, config);
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
});