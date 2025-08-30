// Since this is a TypeScript project, we need to use a different approach
const fetch = require('node-fetch');

// Test by calling the API endpoint directly
async function testNotificationAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/dingtalk/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ DingTalk webhook test successful');
      const result = await response.text();
      console.log('Response:', result);
    } else {
      console.log('❌ DingTalk webhook test failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

async function testSubscriptionNotifications() {
  console.log('=== Testing Subscription Notifications ===');
  
  console.log('1. Testing DingTalk webhook connection...');
  await testNotificationAPI();
  
  console.log('\n=== Test completed ===');
  console.log('Note: Actual subscription notifications will be sent automatically when:');
  console.log('- A subscription payment succeeds');
  console.log('- A subscription payment fails');
  console.log('- Check the backend logs for notification status');
}

testSubscriptionNotifications();