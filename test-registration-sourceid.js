// Test script to verify sourceid is being passed during registration
const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistrationWithSourceId() {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    sourceid: '1000ai'
  };

  try {
    console.log('Testing registration with sourceid...');
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
      console.log('User created:', result.user);
      console.log('Token received:', result.token ? 'Yes' : 'No');
      
      // Verify user was created with correct sourceid
      if (result.user.id) {
        console.log('\nVerifying user data in database...');
        // This would require a separate API call to check the user's sourceid
        console.log('User ID:', result.user.id);
      }
    } else {
      console.log('❌ Registration failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRegistrationWithSourceId();