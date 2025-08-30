// 使用内置的 fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testCreemCheckout() {
  try {
    console.log('Testing Creem checkout fix...');
    
    // 首先获取一个测试用户的token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed, creating test user...');
      // 如果登录失败，尝试注册
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
      });
      
      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        console.error('Registration failed:', errorData);
        return;
      }
      
      const registerData = await registerResponse.json();
      console.log('User registered successfully');
    }
    
    // 重新登录获取token
    const loginRetry = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!loginRetry.ok) {
      console.error('Login failed after registration');
      return;
    }
    
    const loginData = await loginRetry.json();
    const token = loginData.token;
    console.log('Login successful, got token');
    
    // 获取订阅计划
    const plansResponse = await fetch('http://localhost:3000/api/subscriptions/plans');
    if (!plansResponse.ok) {
      console.error('Failed to get plans');
      return;
    }
    
    const plansData = await plansResponse.json();
    const testPlan = plansData.plans.find(plan => plan.price > 0);
    
    if (!testPlan) {
      console.error('No paid plans found');
      return;
    }
    
    console.log('Using test plan:', testPlan.name);
    
    // 测试创建checkout
    const checkoutResponse = await fetch('http://localhost:3000/api/subscriptions/creem/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        planId: testPlan.id,
        successUrl: 'http://localhost:3000/success'
      })
    });
    
    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error('Checkout failed:', errorData);
      return;
    }
    
    const checkoutData = await checkoutResponse.json();
    console.log('Checkout created successfully!');
    console.log('Checkout URL:', checkoutData.checkoutUrl);
    console.log('Session ID:', checkoutData.sessionId);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCreemCheckout();