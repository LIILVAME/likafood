module.exports = async () => {
  // Stop the MongoDB Memory Server
  if (global.__MONGOINSTANCE) {
    await global.__MONGOINSTANCE.stop();
    console.log('🧹 MongoDB Memory Server stopped');
  }
  
  // Clean up global variables
  delete global.__MONGOINSTANCE;
  delete global.__MONGO_URI__;
  
  console.log('🧪 Global test teardown completed');
};