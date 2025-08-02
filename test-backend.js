// Simple script to test backend health
const axios = require('axios');

async function testBackend() {
  const backendUrl = 'https://mental-health-companion-backend-eight.vercel.app/';
  
  console.log('Testing backend health...');
  console.log('Backend URL:', backendUrl);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing /api/health endpoint...');
    const healthResponse = await axios.get(`${backendUrl}/api/health`);
    console.log('✅ Health check successful:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    
    // Test login endpoint with dummy data to see error
    console.log('\n2. Testing /api/auth/login endpoint...');
    try {
      const loginResponse = await axios.post(`${backendUrl}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
      console.log('✅ Login endpoint accessible');
    } catch (loginError) {
      if (loginError.response) {
        console.log('❌ Login failed (expected):');
        console.log('Status:', loginError.response.status);
        console.log('Data:', loginError.response.data);
      } else {
        console.log('❌ Network error:', loginError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Backend test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBackend();
