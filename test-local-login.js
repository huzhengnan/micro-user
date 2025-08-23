const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLocalLogin() {
  try {
    console.log('=== Testing Local Login API ===');
    
    // 测试登录
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernameOrEmail: 'huzhengnan@foxmail.com',
        password: 'your-password-here' // 你需要知道正确的密码
      }),
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData);
      
      // 如果登录失败，我们可以尝试创建一个测试用户
      console.log('\n=== Creating Test User ===');
      const registerResponse = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpassword123'
        }),
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('Test user created successfully');
        console.log('Token:', registerData.token);
        
        // 测试获取用户信息
        await testUserInfo(registerData.token);
      } else {
        const registerError = await registerResponse.json();
        console.log('Registration failed:', registerError);
      }
      
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful');
    console.log('User:', loginData.user.username);
    console.log('Token:', loginData.token);
    
    // 测试获取用户信息
    await testUserInfo(loginData.token);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testUserInfo(token) {
  try {
    console.log('\n=== Testing User Info API ===');
    
    const userResponse = await fetch('http://localhost:3000/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('User info retrieved successfully:');
      console.log(JSON.stringify(userData, null, 2));
    } else {
      const errorData = await userResponse.json();
      console.log('Failed to get user info:', errorData);
    }
  } catch (error) {
    console.error('Error getting user info:', error.message);
  }
}

testLocalLogin();