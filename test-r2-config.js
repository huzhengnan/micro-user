const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// 手动读取 .env 文件
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.log('Warning: Could not load .env file');
  }
}

loadEnv();

async function testR2Config() {
  console.log('Testing Cloudflare R2 Configuration...\n');
  
  // 检查环境变量
  const {
    CLOUDFLARE_R2_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME
  } = process.env;

  console.log('Environment Variables:');
  console.log('- CLOUDFLARE_R2_ACCOUNT_ID:', CLOUDFLARE_R2_ACCOUNT_ID ? '✓ Set' : '✗ Missing');
  console.log('- CLOUDFLARE_R2_ACCESS_KEY_ID:', CLOUDFLARE_R2_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
  console.log('- CLOUDFLARE_R2_SECRET_ACCESS_KEY:', CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
  console.log('- CLOUDFLARE_R2_BUCKET_NAME:', CLOUDFLARE_R2_BUCKET_NAME ? '✓ Set' : '✗ Missing');
  console.log();

  // 检查是否还是占位符值
  const placeholderValues = [
    'your-cloudflare-account-id',
    'your-r2-access-key-id', 
    'your-r2-secret-access-key',
    'your-bucket-name'
  ];

  let hasPlaceholders = false;
  if (placeholderValues.includes(CLOUDFLARE_R2_ACCOUNT_ID)) {
    console.log('⚠️  CLOUDFLARE_R2_ACCOUNT_ID is still a placeholder value');
    hasPlaceholders = true;
  }
  if (placeholderValues.includes(CLOUDFLARE_R2_ACCESS_KEY_ID)) {
    console.log('⚠️  CLOUDFLARE_R2_ACCESS_KEY_ID is still a placeholder value');
    hasPlaceholders = true;
  }
  if (placeholderValues.includes(CLOUDFLARE_R2_SECRET_ACCESS_KEY)) {
    console.log('⚠️  CLOUDFLARE_R2_SECRET_ACCESS_KEY is still a placeholder value');
    hasPlaceholders = true;
  }
  if (placeholderValues.includes(CLOUDFLARE_R2_BUCKET_NAME)) {
    console.log('⚠️  CLOUDFLARE_R2_BUCKET_NAME is still a placeholder value');
    hasPlaceholders = true;
  }

  if (hasPlaceholders) {
    console.log('\n❌ Configuration Error: You need to replace placeholder values with real Cloudflare R2 credentials');
    console.log('\nTo fix this:');
    console.log('1. Go to Cloudflare Dashboard > R2 Object Storage');
    console.log('2. Create a bucket if you haven\'t already');
    console.log('3. Go to "Manage R2 API tokens" and create a new token');
    console.log('4. Update your .env file with the real values');
    return;
  }

  if (!CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // 测试连接
  try {
    console.log('Testing connection to Cloudflare R2...');
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    });

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('✅ Successfully connected to Cloudflare R2!');
    console.log('Available buckets:', response.Buckets?.map(b => b.Name) || []);
    
    // 检查指定的 bucket 是否存在
    if (CLOUDFLARE_R2_BUCKET_NAME) {
      const bucketExists = response.Buckets?.some(b => b.Name === CLOUDFLARE_R2_BUCKET_NAME);
      if (bucketExists) {
        console.log(`✅ Bucket "${CLOUDFLARE_R2_BUCKET_NAME}" exists and is accessible`);
      } else {
        console.log(`⚠️  Bucket "${CLOUDFLARE_R2_BUCKET_NAME}" not found. Available buckets:`, response.Buckets?.map(b => b.Name) || []);
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to connect to Cloudflare R2:');
    console.log('Error:', error.message);
    
    if (error.message.includes('ssl3_read_bytes:ssl/tls alert handshake failure')) {
      console.log('\n🔍 This SSL error usually means:');
      console.log('1. Invalid credentials (access key or secret)');
      console.log('2. Incorrect account ID');
      console.log('3. Network/firewall issues');
    }
  }
}

testR2Config().catch(console.error);