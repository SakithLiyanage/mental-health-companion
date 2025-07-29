const axios = require('axios');
require('dotenv').config();

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter API with free model...');
    console.log('API Key present:', process.env.OPENROUTER_API_KEY ? 'Yes' : 'No');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Mental Health Companion'
        }
      }
    );
    
    console.log('Success! Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testOpenRouter();
