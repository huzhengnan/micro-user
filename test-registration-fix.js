// Test script to verify registration fixes
const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistrationFix() {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    sourceid: '1000ai'
  };

  try {
    console.log('🧪 Testing registration with fixes...');
    console.log('Test user data:', testUser);

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User created:', {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        points: result.user.points,
        isEmailVerified: result.user.isEmailVerified
      });
      console.log('Token received:', result.token ? '✅ Yes' : '❌ No');
      console.log('Message:', result.message);
      
      // Test if we can use the token immediately (simulating auto-login)
      console.log('\n🔐 Testing immediate token usage...');
      const meResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${result.token}`,
        },
      });
      
      if (meResponse.ok) {
        const meResult = await meResponse.json();
        console.log('✅ Token works immediately - user can be auto-logged in');
        console.log('User info from /me endpoint:', {
          id: meResult.user.id,
          username: meResult.user.username,
          points: meResult.user.points
        });
      } else {
        console.log('❌ Token does not work immediately');
      }
      
    } else {
      console.log('❌ Registration failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRegistrationFix();