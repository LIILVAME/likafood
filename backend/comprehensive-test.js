const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  serverHost: '127.0.0.1',
  serverPort: 5001,
  testTimeout: 30000,
  serverStartDelay: 3000
};

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testServerConnectivity() {
  log('\n🔍 Testing Server Connectivity...', 'cyan');
  
  const tests = [
    { host: 'localhost', port: TEST_CONFIG.serverPort, name: 'localhost' },
    { host: '127.0.0.1', port: TEST_CONFIG.serverPort, name: '127.0.0.1' },
    { host: '::1', port: TEST_CONFIG.serverPort, name: 'IPv6 localhost' }
  ];

  for (const test of tests) {
    try {
      const options = {
        hostname: test.host,
        port: test.port,
        path: '/',
        method: 'GET',
        timeout: 3000
      };
      
      const response = await makeRequest(options);
      log(`✅ ${test.name}:${test.port} - Connected (Status: ${response.statusCode})`, 'green');
    } catch (error) {
      log(`❌ ${test.name}:${test.port} - Failed: ${error.message}`, 'red');
    }
  }
}

async function testHealthEndpoint() {
  log('\n🏥 Testing Health Endpoint...', 'cyan');
  
  try {
    const options = {
      hostname: TEST_CONFIG.serverHost,
      port: TEST_CONFIG.serverPort,
      path: '/api/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    log(`✅ Health endpoint responded with status: ${response.statusCode}`, 'green');
    log(`📄 Response: ${response.body}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Health endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAuthEndpoints() {
  log('\n🔐 Testing Authentication Endpoints...', 'cyan');
  
  // Test registration endpoint
  try {
    const registerData = JSON.stringify({
      phoneNumber: '+1234567890',
      businessName: 'Test Restaurant',
      ownerName: 'Test Owner'
    });
    
    const options = {
      hostname: TEST_CONFIG.serverHost,
      port: TEST_CONFIG.serverPort,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
      }
    };
    
    const response = await makeRequest(options, registerData);
    log(`✅ Register endpoint responded with status: ${response.statusCode}`, 'green');
    log(`📄 Response: ${response.body}`, 'blue');
    
    // Parse response to check structure
    try {
      const jsonResponse = JSON.parse(response.body);
      if (jsonResponse.success !== undefined) {
        log(`✅ Response has proper structure`, 'green');
      }
    } catch (parseError) {
      log(`⚠️  Response is not valid JSON`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ Register endpoint failed: ${error.message}`, 'red');
  }
}

async function checkEnvironmentConfig() {
  log('\n⚙️  Checking Environment Configuration...', 'cyan');
  
  const fs = require('fs');
  const envPath = path.join(__dirname, '.env');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    log(`✅ .env file found`, 'green');
    
    // Check for required variables
    const requiredVars = ['PORT', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
    const missingVars = [];
    
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      } else {
        log(`✅ ${varName} is configured`, 'green');
      }
    }
    
    if (missingVars.length > 0) {
      log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    }
    
    // Check MongoDB configuration
    if (envContent.includes('# MONGODB_URI=')) {
      log(`⚠️  MongoDB URI is commented out - using in-memory fallback`, 'yellow');
    } else if (envContent.includes('MONGODB_URI=')) {
      log(`✅ MongoDB URI is configured`, 'green');
    }
    
  } catch (error) {
    log(`❌ Could not read .env file: ${error.message}`, 'red');
  }
}

async function checkDependencies() {
  log('\n📦 Checking Dependencies...', 'cyan');
  
  const fs = require('fs');
  const packagePath = path.join(__dirname, 'package.json');
  
  try {
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    const requiredDeps = [
      'express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 
      'cors', 'helmet', 'express-rate-limit', 'dotenv'
    ];
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (allDeps[dep]) {
        log(`✅ ${dep} v${allDeps[dep]}`, 'green');
      } else {
        log(`❌ Missing dependency: ${dep}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Could not read package.json: ${error.message}`, 'red');
  }
}

async function startServerAndTest() {
  log('\n🚀 Starting Server for Testing...', 'cyan');
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      if (text.includes('Server is ready to accept connections')) {
        serverReady = true;
        log('✅ Server started successfully', 'green');
        
        // Wait a bit then run tests
        setTimeout(async () => {
          await runAllTests();
          
          // Stop the server
          log('\n🛑 Stopping test server...', 'yellow');
          serverProcess.kill('SIGTERM');
          
          setTimeout(() => {
            if (!serverProcess.killed) {
              serverProcess.kill('SIGKILL');
            }
            resolve();
          }, 2000);
          
        }, TEST_CONFIG.serverStartDelay);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      if (!text.includes('DeprecationWarning')) {
        log(`Server Error: ${text}`, 'red');
      }
    });
    
    serverProcess.on('close', (code) => {
      if (!serverReady) {
        log(`❌ Server failed to start (exit code: ${code})`, 'red');
        log(`Server output: ${output}`, 'yellow');
      }
      resolve();
    });
    
    // Timeout if server doesn't start
    setTimeout(() => {
      if (!serverReady) {
        log('❌ Server start timeout', 'red');
        serverProcess.kill('SIGKILL');
        resolve();
      }
    }, 15000);
  });
}

async function runAllTests() {
  await testServerConnectivity();
  const healthOk = await testHealthEndpoint();
  
  if (healthOk) {
    await testAuthEndpoints();
  } else {
    log('⚠️  Skipping auth tests due to health check failure', 'yellow');
  }
}

async function main() {
  log('🧪 LikaFood Authentication System - Comprehensive Test', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  // Pre-flight checks
  await checkEnvironmentConfig();
  await checkDependencies();
  
  // Start server and run tests
  await startServerAndTest();
  
  log('\n✨ Test completed!', 'magenta');
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 Test interrupted by user', 'yellow');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, runAllTests };