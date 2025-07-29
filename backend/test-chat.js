const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testChatOnly() {
  try {
    console.log('Testing chat functionality...\n');

    // Test login with existing user
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test2@test.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data.message);
    const token = loginResponse.data.token;

    // Test chat endpoint
    console.log('\n2. Testing chat endpoint...');
    const chatResponse = await axios.post(`${API_BASE}/chat`, {
      message: 'Hello, I am feeling a bit anxious today'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Chat response received!');
    console.log('User message:', chatResponse.data.userMessage.message);
    console.log('AI response:', chatResponse.data.aiMessage.message);

    // Test chat history
    console.log('\n3. Testing chat history...');
    const historyResponse = await axios.get(`${API_BASE}/chat/history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`Chat history: ${historyResponse.data.messages.length} messages found`);
    
    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testChatOnly();
