#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function healthCheck(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runHealthChecks() {
  console.log('🏥 开始健康检查...\n');
  
  const checks = [
    {
      name: '后端 API 健康检查',
      url: process.env.API_BASE_URL || 'https://micro-user-gray.vercel.app/api',
      path: '/debug/env'
    },
    {
      name: '前端应用检查',
      url: process.env.FRONTEND_URL || 'https://www.1000ai.ai',
      path: ''
    }
  ];
  
  for (const check of checks) {
    try {
      console.log(`🔍 检查: ${check.name}`);
      console.log(`📍 URL: ${check.url}${check.path}`);
      
      const result = await healthCheck(`${check.url}${check.path}`);
      
      if (result.status >= 200 && result.status < 400) {
        console.log(`✅ ${check.name} - 状态: ${result.status}`);
      } else {
        console.log(`⚠️  ${check.name} - 状态: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${check.name} - 错误: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 健康检查完成');
}

// 运行健康检查
runHealthChecks().catch(console.error);