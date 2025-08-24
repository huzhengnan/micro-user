const fetch = globalThis.fetch;

async function testLocalAPI() {
  console.log('🧪 测试本地API端点');
  
  const baseUrl = 'http://localhost:3000/api';
  
  // 1. 测试 /api/features/use 端点（无认证）
  console.log('\n1️⃣ 测试 /api/features/use（无认证）...');
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
    
    console.log(`状态: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`响应: ${responseText}`);
    
    if (response.status === 401) {
      console.log('✅ 端点存在且正常工作（返回401未授权）');
    } else if (response.status === 404) {
      console.log('❌ 端点不存在（返回404）');
    } else {
      console.log(`ℹ️ 其他状态: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
  
  // 2. 测试其他端点确认服务器正常
  console.log('\n2️⃣ 测试其他端点...');
  const testRoutes = [
    { path: '/features', method: 'GET' },
    { path: '/users/me', method: 'GET' },
    { path: '/debug/config', method: 'GET' }
  ];
  
  for (const route of testRoutes) {
    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method
      });
      console.log(`${route.path}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${route.path}: 连接失败 - ${error.message}`);
    }
  }
  
  // 3. 检查服务器信息
  console.log('\n3️⃣ 检查服务器信息...');
  try {
    const response = await fetch(`${baseUrl}/debug/config`);
    if (response.ok) {
      const config = await response.json();
      console.log('服务器配置:', JSON.stringify(config, null, 2));
    }
  } catch (error) {
    console.log('无法获取服务器配置');
  }
  
  console.log('\n✨ 测试完成');
}

// 运行测试
testLocalAPI().catch(console.error);