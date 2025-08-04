// 测试OpenRouter API连接的脚本
require('dotenv').config();

const testOpenRouter = async () => {
  console.log('=== Testing OpenRouter API ===');
  console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
  console.log('Base URL:', process.env.OPENROUTER_BASE_URL);

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OpenRouter API key is not set');
    return;
  }

  try {
    const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://1000ai.ai',
        'X-Title': '1000ai.ai Work Language Translator Test',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "Test successful".'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return;
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log('=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  }
};

testOpenRouter();