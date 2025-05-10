
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

describe('OpenAI API Connectivity Tests', () => {
  // Make sure API key is available
  test('API key is available in environment', () => {
    expect(OPENAI_API_KEY).toBeDefined();
    expect(OPENAI_API_KEY.length).toBeGreaterThan(0);
  });

  // Test actual API connectivity with a simple request
  test('Can connect to OpenAI API and get a response', async () => {
    // Skip test if no API key is available
    if (!OPENAI_API_KEY) {
      console.warn('Skipping API connectivity test - No API key available');
      return;
    }

    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a women\'s health assistant.' },
        { role: 'user', content: 'Return only the word "CONNECTED" if you can read this message.' }
      ],
      temperature: 0,
      max_tokens: 10
    };

    try {
      const response = await axios.post(OPENAI_API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      console.log('API Response:', response.data.choices[0].message.content.trim());

      // Check if we got a valid response
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.choices).toBeDefined();
      expect(response.data.choices.length).toBeGreaterThan(0);
      
      // Check if response contains "CONNECTED"
      const responseContent = response.data.choices[0].message.content.trim();
      expect(responseContent).toContain('CONNECTED');
      
      // Log success for clarity
      console.log('API Connection Test Successful:', responseContent);
    } catch (error) {
      // Log the full error details for debugging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else {
        console.error('API Connection Error:', error.message);
      }
      
      // Make the test fail
      throw error;
    }
  }, 10000); // Increasing timeout to 10 seconds for API call
});