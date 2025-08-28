const fetch = require('node-fetch');

// Test the points API
async function testPointsAPI() {
  try {
    // You'll need to replace this with a valid JWT token
    const testToken = 'your-test-jwt-token-here';
    
    console.log('🧪 Testing Points API...');
    
    // Test GET /api/users/points
    const response = await fetch('http://localhost:3000/api/users/points', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Points API successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.log('❌ Points API failed!');
      console.log('Error:', JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test token verification
async function testTokenVerification() {
  try {
    const testToken = 'your-test-jwt-token-here';
    
    console.log('🧪 Testing Token Verification...');
    
    // Test GET /api/users/me (which also uses verifyToken)
    const response = await fetch('http://localhost:3000/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token verification successful!');
      console.log('User data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.log('❌ Token verification failed!');
      console.log('Error:', JSON.stringify(errorData, null, 2));
    }

  } catch (error) {
    console.error('❌ Token test failed:', error.message);
  }
}

// Run the tests
console.log('Starting API tests...');
testTokenVerification();
setTimeout(() => testPointsAPI(), 1000);