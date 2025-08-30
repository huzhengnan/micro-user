// 测试订阅流程
async function testSubscriptionFlow() {
  console.log('=== Testing Subscription Flow ===');
  
  // 模拟前端发送的请求
  const mockRequest = {
    planId: '4e9c0816-b5bb-48a9-b65c-bc23862927a4',
    successUrl: 'http://localhost:5173?subscription=success',
    cancelUrl: 'http://localhost:5173?subscription=cancelled'
  };
  
  console.log('Original request:', mockRequest);
  
  // 模拟URL清理逻辑
  function cleanUrl(url) {
    if (url) {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    }
    return null;
  }
  
  const cleanedSuccessUrl = cleanUrl(mockRequest.successUrl);
  console.log('Cleaned success URL:', cleanedSuccessUrl);
  
  // 验证URL格式
  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url);
      // Creem 要求简单的URL格式，不能有查询参数
      return !urlObj.search && !urlObj.hash;
    } catch {
      return false;
    }
  };
  
  console.log('Original URL valid for Creem:', isValidUrl(mockRequest.successUrl));
  console.log('Cleaned URL valid for Creem:', isValidUrl(cleanedSuccessUrl));
  
  // 模拟Creem请求体
  const creemRequestBody = {
    success_url: cleanedSuccessUrl,
    request_id: `sub_${Date.now()}_test`,
    product_id: 'prod_2NYN1msP3QaEepZs36pib1',
    customer: {
      email: 'test@example.com'
    },
    metadata: {
      userId: 'test-user-id',
      planId: mockRequest.planId,
      planName: 'Standard Plan',
      planDuration: '30',
      monthlyPoints: '250',
      isSubscription: 'true'
    }
  };
  
  console.log('Creem request body:', JSON.stringify(creemRequestBody, null, 2));
  console.log('=== Test Complete ===');
}

testSubscriptionFlow();