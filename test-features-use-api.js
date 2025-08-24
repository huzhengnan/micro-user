// 使用内置的 fetch (Node.js 18+)
const fetch = globalThis.fetch;

// 测试配置
const config = {
  // 本地测试
  local: {
    baseUrl: 'http://localhost:3000/api',
    testUser: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    }
  },
  // 生产环境测试
  production: {
    baseUrl: 'https://micro-user-gray.vercel.app/api',
    testUser: {
      username: 'testuser',
      email: 'test@example.com', 
      password: 'password123'
    }
  }
};

async function testFeaturesUseAPI(environment = 'local') {
  const { baseUrl, testUser } = config[environment];
  
  console.log(`\n🧪 测试 /api/features/use 端点 - ${environment} 环境`);
  console.log(`Base URL: ${baseUrl}`);
  
  try {
    // 1. 先尝试登录获取token
    console.log('\n1️⃣ 尝试用户登录...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ 登录失败: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorText = await loginResponse.text();
      console.log('错误详情:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功，获得token');
    
    // 2. 测试 /api/features/use 端点
    console.log('\n2️⃣ 测试 /api/features/use 端点...');
    
    const useFeatureResponse = await fetch(`${baseUrl}/features/use?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        featureKey: 'image_generation',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    console.log(`响应状态: ${useFeatureResponse.status} ${useFeatureResponse.statusText}`);
    
    if (useFeatureResponse.ok) {
      const responseData = await useFeatureResponse.json();
      console.log('✅ API调用成功!');
      console.log('响应数据:', JSON.stringify(responseData, null, 2));
    } else {
      console.log('❌ API调用失败');
      const errorText = await useFeatureResponse.text();
      console.log('错误详情:', errorText);
      
      // 如果是404，检查路由是否存在
      if (useFeatureResponse.status === 404) {
        console.log('\n🔍 检查可用的API路由...');
        await checkAvailableRoutes(baseUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

async function checkAvailableRoutes(baseUrl) {
  try {
    // 测试一些已知的路由
    const routes = [
      '/features',
      '/users/me',
      '/auth/login'
    ];
    
    console.log('\n检查已知路由状态:');
    for (const route of routes) {
      try {
        const response = await fetch(`${baseUrl}${route}`, {
          method: 'GET'
        });
        console.log(`${route}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${route}: 连接失败 - ${error.message}`);
      }
    }
  } catch (error) {
    console.error('检查路由时发生错误:', error.message);
  }
}

// 直接测试路由是否存在（不需要认证）
async function testRouteExists(environment = 'local') {
  const { baseUrl } = config[environment];
  
  console.log(`\n🔍 直接测试路由存在性 - ${environment} 环境`);
  
  try {
    const response = await fetch(`${baseUrl}/features/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        featureKey: 'test'
      })
    });
    
    console.log(`/api/features/use 状态: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ 路由存在，返回401未授权（正常，因为没有提供token）');
    } else if (response.status === 404) {
      console.log('❌ 路由不存在，返回404');
    } else {
      console.log(`ℹ️ 其他状态码: ${response.status}`);
      const responseText = await response.text();
      console.log('响应内容:', responseText);
    }
    
  } catch (error) {
    console.error('❌ 测试路由存在性时发生错误:', error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试 /api/features/use 端点\n');
  
  // 测试生产环境路由存在性
  await testRouteExists('production');
  
  // 测试本地环境路由存在性  
  await testRouteExists('local');
  
  // 如果有测试用户，尝试完整的API测试
  console.log('\n如果你有测试用户账号，可以修改脚本中的testUser配置后运行完整测试');
  
  console.log('\n✨ 测试完成');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testFeaturesUseAPI,
  testRouteExists,
  runTests
};