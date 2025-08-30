// 测试订阅功能
const fetch = globalThis.fetch;

async function testSubscription() {
  try {
    console.log('🧪 测试订阅功能...');

    // 1. 获取订阅计划
    console.log('📋 获取订阅计划...');
    const plansResponse = await fetch('http://localhost:3000/api/subscriptions/plans');
    if (!plansResponse.ok) {
      throw new Error('Failed to get plans');
    }
    
    const plansData = await plansResponse.json();
    const testPlan = plansData.plans.find(plan => plan.name === 'Standard Plan');
    
    if (!testPlan) {
      throw new Error('Standard Plan not found');
    }
    
    console.log('✅ 找到测试计划:', {
      name: testPlan.name,
      price: `$${(testPlan.price / 100).toFixed(2)}`,
      points: testPlan.monthlyPoints
    });

    // 2. 登录获取token
    console.log('🔐 登录获取token...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    console.log('✅ 登录成功');

    // 3. 创建订阅checkout
    console.log('💳 创建订阅checkout...');
    const checkoutResponse = await fetch('http://localhost:3000/api/subscriptions/creem/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        planId: testPlan.id,
        successUrl: 'http://localhost:5173?subscription=success'
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      throw new Error(`Checkout failed: ${errorData.error}`);
    }

    const checkoutData = await checkoutResponse.json();
    console.log('✅ Checkout创建成功!');
    console.log('🔗 Checkout URL:', checkoutData.checkoutUrl);
    console.log('🆔 Session ID:', checkoutData.sessionId);

    console.log('\n🎉 订阅功能测试通过！');
    console.log('💡 你现在可以在前端尝试订阅功能了。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testSubscription();