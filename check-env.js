// 检查环境变量的脚本
console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CREEM_CHECKOUT_URL:', process.env.CREEM_CHECKOUT_URL ? 'SET' : 'NOT SET');
console.log('CREEM_API_KEY:', process.env.CREEM_API_KEY ? 'SET' : 'NOT SET');
console.log('API_BASE_URL:', process.env.API_BASE_URL ? 'SET' : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? 'SET' : 'NOT SET');
console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('===================================');