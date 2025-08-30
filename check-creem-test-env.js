// 检查 Creem 测试环境配置
const fetch = globalThis.fetch;

async function checkCreemTestEnv() {
  console.log('🔍 检查 Creem 测试环境配置...');
  
  // 常见的测试环境 URL 模式
  const testUrls = [
    'https://api-test.creem.io/v1/checkout',
    'https://sandbox.creem.io/v1/checkout', 
    'https://test-api.creem.io/v1/checkout',
    'https://staging.creem.io/v1/checkout'
  ];

  console.log('\n📋 可能的测试环境 URL:');
  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });

  console.log('\n💡 建议的解决方案:');
  console.log('1. 查看 Creem 官方文档确认测试环境 URL');
  console.log('2. 检查 Creem 控制台是否有测试/沙盒模式');
  console.log('3. 联系 Creem 技术支持获取测试环境配置');
  console.log('4. 或者使用生产环境进行小额测试 (如 $0.01)');

  console.log('\n🔧 临时解决方案:');
  console.log('如果 Creem 没有独立的测试环境，可以:');
  console.log('- 使用生产环境 API');
  console.log('- 创建小额测试产品 (如 $0.01)');
  console.log('- 使用测试信用卡进行验证');

  // 检查当前环境变量
  console.log('\n⚙️  当前配置:');
  console.log(`CREEM_CHECKOUT_URL: ${process.env.CREEM_CHECKOUT_URL || '未设置'}`);
  console.log(`CREEM_API_KEY: ${process.env.CREEM_API_KEY ? '已设置' : '未设置'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);

  // 测试当前配置的连通性
  if (process.env.CREEM_CHECKOUT_URL && process.env.CREEM_API_KEY) {
    console.log('\n🧪 测试当前配置的连通性...');
    try {
      const response = await fetch(process.env.CREEM_CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CREEM_API_KEY
        },
        body: JSON.stringify({
          success_url: 'http://localhost:3000/test',
          request_id: 'connectivity_test_' + Date.now(),
          product_id: 'prod_test_connectivity',
          customer: { email: 'test@example.com' }
        })
      });

      console.log(`状态码: ${response.status}`);
      
      if (response.status === 404) {
        console.log('❌ 404 - 可能是产品ID不存在或URL不正确');
      } else if (response.status === 401) {
        console.log('❌ 401 - API密钥可能无效');
      } else if (response.status === 400) {
        console.log('⚠️  400 - 请求格式问题，但API端点可达');
      } else {
        console.log('✅ API端点可达');
      }

      const responseText = await response.text();
      console.log(`响应: ${responseText.substring(0, 300)}...`);

    } catch (error) {
      console.log(`❌ 连接错误: ${error.message}`);
    }
  }
}

checkCreemTestEnv();