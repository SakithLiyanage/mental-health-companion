const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('Testing authentication flow...\n');

    // Test registration
    console.log('1. Testing registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'test2@test.com',
      password: 'password123',
      username: 'testuser2',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('Registration successful:', registerResponse.data.message);
    const token = registerResponse.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test2@test.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data.message);
    const loginToken = loginResponse.data.token;
    console.log('Login token received:', loginToken ? 'Yes' : 'No');

    // Test /me endpoint
    console.log('\n3. Testing /me endpoint...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });
    console.log('User data:', meResponse.data.user);

    // Test chat endpoint
    console.log('\n4. Testing chat endpoint...');
    const chatResponse = await axios.post(`${API_BASE}/chat`, {
      message: 'Hello, how are you?'
    }, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });
    console.log('Chat response:', chatResponse.data);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAuth();
