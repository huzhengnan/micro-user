const fetch = require('node-fetch');

// 测试配置
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER_TOKEN = 'your-test-user-jwt-token'; // 需要替换为实际的用户token

async function testCreemIntegration() {
  console.log('🧪 开始测试 Creem 支付集成...\n');

  try {
    // 1. 测试获取订阅计划
    console.log('1️⃣ 测试获取订阅计划...');
    const plansResponse = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
    const plansData = await plansResponse.json();
    
    if (!plansResponse.ok) {
      throw new Error(`获取订阅计划失败: ${plansData.error}`);
    }
    
    console.log('✅ 订阅计划获取成功');
    console.log('可用计划:', plansData.plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      monthlyPoints: p.monthlyPoints
    })));
    
    if (plansData.plans.length === 0) {
      console.log('⚠️  没有找到订阅计划，请先运行初始化脚本');
      return;
    }

    // 2. 测试创建Creem checkout
    console.log('\n2️⃣ 测试创建 Creem checkout...');
    const testPlan = plansData.plans[0]; // 使用第一个计划进行测试
    
    const checkoutData = {
      planId: testPlan.id,
      successUrl: `${API_BASE_URL}?subscription=success`,
      cancelUrl: `${API_BASE_URL}?subscription=cancelled`
    };
    
    console.log('请求数据:', checkoutData);
    
    const checkoutResponse = await fetch(`${API_BASE_URL}/api/subscriptions/creem/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      },
      body: JSON.stringify(checkoutData)
    });
    
    const checkoutResult = await checkoutResponse.json();
    
    if (!checkoutResponse.ok) {
      throw new Error(`创建 checkout 失败: ${checkoutResult.error}`);
    }
    
    console.log('✅ Creem checkout 创建成功');
    console.log('Checkout URL:', checkoutResult.checkoutUrl);
    console.log('Session ID:', checkoutResult.sessionId);
    
    // 3. 测试webhook端点（模拟webhook调用）
    console.log('\n3️⃣ 测试 webhook 端点...');
    const mockWebhookData = {
      event_type: 'checkout.completed',
      checkout_id: checkoutResult.sessionId,
      request_id: `test_${Date.now()}`,
      status: 'paid',
      amount: testPlan.price,
      currency: 'USD',
      metadata: {
        userId: 'test-user-id',
        planId: testPlan.id,
        planName: testPlan.name,
        isSubscription: 'true'
      }
    };
    
    console.log('模拟 webhook 数据:', mockWebhookData);
    
    const webhookResponse = await fetch(`${API_BASE_URL}/api/webhooks/creem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockWebhookData)
    });
    
    const webhookResult = await webhookResponse.json();
    
    if (!webhookResponse.ok) {
      console.log('⚠️  Webhook 测试失败 (这是正常的，因为没有对应的交易记录)');
      console.log('错误:', webhookResult.error);
    } else {
      console.log('✅ Webhook 端点响应正常');
      console.log('结果:', webhookResult);
    }
    
    console.log('\n🎉 Creem 集成测试完成！');
    console.log('\n📋 下一步操作:');
    console.log('1. 确保 .env 文件中配置了正确的 CREEM_API_KEY 和 CREEM_CHECKOUT_URL');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 在前端测试实际的支付流程');
    console.log('4. 配置 Creem webhook URL 指向: ' + `${API_BASE_URL}/api/webhooks/creem`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n🔧 故障排除:');
    console.error('1. 检查服务器是否正在运行');
    console.error('2. 检查数据库连接是否正常');
    console.error('3. 检查用户token是否有效');
    console.error('4. 检查环境变量配置');
  }
}

// 运行测试
if (require.main === module) {
  testCreemIntegration();
}

module.exports = { testCreemIntegration };