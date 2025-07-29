const axios = require('axios');
require('dotenv').config({ path: __dirname + '/.env' });

async function testHuggingFaceAPI() {
  console.log('Testing Hugging Face API key...');
  console.log('API Key:', process.env.HUGGINGFACE_API_KEY ? `${process.env.HUGGINGFACE_API_KEY.substring(0, 10)}...` : 'Missing');
  
  // Test API key validity first
  try {
    console.log('\n--- Testing API key validity ---');
    const whoamiResponse = await axios.get('https://huggingface.co/api/whoami', {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      }
    });
    console.log('✅ API key is valid');
    console.log('User info:', whoamiResponse.data);
  } catch (error) {
    console.log('❌ API key validation failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return;
  }
  
  // Test different API formats
  const testCases = [
    {
      name: 'GPT-2 (Text Generation)',
      url: 'https://api-inference.huggingface.co/models/gpt2',
      payload: { inputs: "Hello, I'm feeling anxious today and" }
    },
    {
      name: 'DistilGPT-2 (Text Generation)', 
      url: 'https://api-inference.huggingface.co/models/distilgpt2',
      payload: { inputs: "Hello, I'm feeling anxious today and" }
    },
    {
      name: 'FLAN-T5 (Text-to-Text)',
      url: 'https://api-inference.huggingface.co/models/google/flan-t5-small',
      payload: { inputs: "I'm feeling anxious today. Can you help me?" }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n--- Testing: ${test.name} ---`);
    
    try {
      const response = await axios.post(test.url, test.payload, {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });
      
      console.log('✅ Success!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return; // Exit on first success
      
    } catch (error) {
      console.log('❌ Failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

testHuggingFaceAPI();
