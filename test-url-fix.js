// 测试URL清理逻辑
function cleanUrl(successUrl) {
  if (successUrl) {
    // 移除查询参数，只保留基础URL
    const url = new URL(successUrl);
    return `${url.protocol}//${url.host}${url.pathname}`;
  }
  return null;
}

// 测试用例
const testUrls = [
  'http://localhost:5173?subscription=success',
  'http://localhost:5173/?subscription=success',
  'http://localhost:5173/dashboard?subscription=success',
  'https://example.com?param=value',
  'https://example.com/path?param=value&other=test'
];

console.log('Testing URL cleaning:');
testUrls.forEach(url => {
  const cleaned = cleanUrl(url);
  console.log(`${url} -> ${cleaned}`);
});