const axios = require('axios');

async function testChatAPI() {
  try {
    // First, let's test the health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check response:', healthResponse.data);
    
    // Test if we can reach the chat endpoint (this will fail without auth, but we'll see the error)
    console.log('\nTesting chat endpoint without auth...');
    try {
      const chatResponse = await axios.post('http://localhost:5000/api/chat', {
        message: 'Hello, this is a test message',
        mood: '😊'
      });
      console.log('Chat response:', chatResponse.data);
    } catch (error) {
      console.log('Expected auth error:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testChatAPI();
