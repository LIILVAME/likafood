const http = require('http');

// Test server connectivity
function testServer(port) {
  console.log(`🧪 Testing server on port ${port}...`);
  
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server responded with status: ${res.statusCode}`);
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response:', data);
      testAuthEndpoint(port);
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Connection failed: ${err.message}`);
    console.log('🔍 Trying different approach...');
    
    // Try with 127.0.0.1
    const options2 = {
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET'
    };
    
    const req2 = http.request(options2, (res) => {
      console.log(`✅ Server responded on 127.0.0.1 with status: ${res.statusCode}`);
    });
    
    req2.on('error', (err2) => {
      console.log(`❌ Also failed on 127.0.0.1: ${err2.message}`);
    });
    
    req2.end();
  });

  req.end();
}

function testAuthEndpoint(port) {
  console.log('\n🔐 Testing auth registration endpoint...');
  
  const postData = JSON.stringify({
    phoneNumber: '+1234567890',
    businessName: 'Test Restaurant',
    ownerName: 'John Doe'
  });

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Auth endpoint responded with status: ${res.statusCode}`);
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Auth Response:', data);
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Auth endpoint failed: ${err.message}`);
  });

  req.write(postData);
  req.end();
}

// Test both ports
testServer(5001);
setTimeout(() => testServer(5002), 2000);