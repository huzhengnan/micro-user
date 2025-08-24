const fetch = globalThis.fetch;

async function testProductionAPI() {
  console.log('🧪 测试生产环境API...');
  
  const baseUrl = 'https://micro-user-mprahj917-huzhengnans-projects.vercel.app/api';
  
  // 测试用户token（从你之前的请求中获取）
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MGUwMzA3NC02ZmMzLTRlZjMtYThiNC0zMzVmZDBkNDkwYWQiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc1NjAwMzgyMiwiZXhwIjoxNzU2MDkwMjIyfQ.LRIjE7l11COYdlu6yX57oQfgKogWyCjca4Nnkyi99cM';
  
  try {
    // 1. 测试基础API连接
    console.log('\n1️⃣ 测试基础API连接...');
    try {
      const healthResponse = await fetch(`${baseUrl}/features`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`GET /features: ${healthResponse.status} ${healthResponse.statusText}`);
      
      if (healthResponse.ok) {
        const features = await healthResponse.json();
        console.log(`✅ API连接正常，返回 ${features.length} 个功能配置`);
      }
    } catch (error) {
      console.log(`❌ 基础API连接失败: ${error.message}`);
      return;
    }
    
    // 2. 测试 /api/features/use 端点
    console.log('\n2️⃣ 测试 /api/features/use 端点...');
    
    const testCases = [
      { featureKey: 'image_generation', description: '图片生成' },
      { featureKey: 'pixel_art_generation', description: '像素艺术生成' },
      { featureKey: 'photo_style_transfer', description: '照片风格转换' },
      { featureKey: 'work_translation', description: '作品翻译' }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n测试 ${testCase.description} (${testCase.featureKey})...`);
        
        const response = await fetch(`${baseUrl}/features/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testToken}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            featureKey: testCase.featureKey,
            metadata: {
              test: true,
              timestamp: new Date().toISOString(),
              action: testCase.featureKey
            }
          })
        });
        
        console.log(`状态: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ 成功! 用户积分: ${result.user.points}, 消耗积分: ${result.featureUsage.pointsUsed}`);
        } else {
          const errorText = await response.text();
          console.log(`❌ 失败: ${errorText}`);
          
          // 如果是401，说明token过期了
          if (response.status === 401) {
            console.log('💡 Token可能已过期，请使用新的token重新测试');
            break;
          }
        }
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ 请求 ${testCase.featureKey} 时发生错误: ${error.message}`);
      }
    }
    
    // 3. 测试无效的featureKey
    console.log('\n3️⃣ 测试无效的featureKey...');
    try {
      const response = await fetch(`${baseUrl}/features/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          featureKey: 'invalid_feature',
          metadata: { test: true }
        })
      });
      
      console.log(`无效功能测试: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log('✅ 正确返回404，说明功能验证正常工作');
      }
    } catch (error) {
      console.log(`❌ 测试无效功能时发生错误: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
  
  console.log('\n✨ API测试完成');
}

// 测试不需要认证的端点
async function testPublicEndpoints() {
  console.log('🌐 测试公共端点...');
  
  const baseUrl = 'https://micro-user-mprahj917-huzhengnans-projects.vercel.app/api';
  
  const publicEndpoints = [
    { path: '/features', method: 'GET', description: '功能列表' },
    { path: '/debug/config', method: 'GET', description: '配置信息' },
    { path: '/subscriptions/plans', method: 'GET', description: '订阅计划' }
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      console.log(`\n测试 ${endpoint.description} (${endpoint.method} ${endpoint.path})...`);
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`状态: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ 响应正常');
      } else if (response.status === 401) {
        console.log('🔒 需要认证（正常）');
      } else {
        const errorText = await response.text();
        console.log(`⚠️ 其他状态: ${errorText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
  }
}

async function main() {
  const testType = process.argv[2] || 'full';
  
  if (testType === 'public') {
    await testPublicEndpoints();
  } else {
    await testPublicEndpoints();
    await testProductionAPI();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProductionAPI, testPublicEndpoints };