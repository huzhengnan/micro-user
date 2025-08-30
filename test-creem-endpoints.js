// 测试不同的 Creem 端点
const fetch = globalThis.fetch;

const possibleTestUrls = [
  'https://api-test.creem.io/v1/checkout',
  'https://sandbox.creem.io/v1/checkout',
  'https://test.creem.io/v1/checkout',
  'https://staging.creem.io/v1/checkout',
  'https://dev.creem.io/v1/checkout',
  'https://api.creem.io/v1/test/checkout',
  'https://api.creem.io/test/v1/checkout'
];

async function testCreemEndpoints() {
  console.log('🧪 测试 Creem 可能的测试环境端点...');
  
  const testPayload = {
    success_url: 'http://localhost:3000/test',
    request_id: 'test_request_123',
    product_id: 'prod_test_123',
    customer: {
      email: 'test@example.com'
    }
  };

  for (const url of possibleTestUrls) {
    try {
      console.log(`\n🔍 测试: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CREEM_API_KEY || 'test-key'
        },
        body: JSON.stringify(testPayload),
        timeout: 5000
      });

      console.log(`   状态: ${response.status}`);
      
      if (response.status !== 404) {
        const responseText = await response.text();
        console.log(`   响应: ${responseText.substring(0, 200)}...`);
        
        if (response.status === 200 || response.status === 400) {
          console.log(`   ✅ 可能的测试端点: ${url}`);
        }
      } else {
        console.log(`   ❌ 404 - 端点不存在`);
      }
      
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    }
  }

  console.log('\n📋 建议:');
  console.log('1. 检查 Creem 官方文档获取正确的测试环境 URL');
  console.log('2. 联系 Creem 支持获取测试环境配置');
  console.log('3. 或者使用生产环境进行小额测试');
}

testCreemEndpoints();