// src/testNLU.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/nlu/process';

// Test cases
const testCases = [
  {
    userId: 'test-user-1',
    message: 'My period started yesterday with heavy flow and some cramps.'
  },
  {
    userId: 'test-user-1',
    message: 'I\'ve been feeling tired and have a headache today. Is this related to my cycle?'
  },
  {
    userId: 'test-user-1',
    message: 'When is my next period likely to start?'
  }
];

// Run tests
async function runTests() {
  console.log('Starting NLU component tests...\n');
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`Test ${index + 1}: "${testCase.message}"`);
    
    try {
      const response = await axios.post(API_URL, testCase);
      console.log('Intent:', JSON.stringify(response.data.intent, null, 2));
      console.log('Entities:', JSON.stringify(response.data.entities, null, 2));
      console.log('Cycle Data:', JSON.stringify(response.data.cycleData, null, 2));
      console.log('Context:', JSON.stringify(response.data.contextAwareness, null, 2));
      console.log('---\n');
    } catch (error: any) {
      console.error('Test failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      console.log('---\n');
    }
  }
  
  console.log('Tests completed!');
}

runTests();