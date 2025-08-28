# Cloudflare R2 Integration Setup

This document explains how to set up and use the Cloudflare R2 integration for image uploads in the micro-user service.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with R2 enabled
2. **R2 Bucket**: Create an R2 bucket for storing images
3. **API Tokens**: Generate R2 API tokens with appropriate permissions

## Environment Configuration

Add the following environment variables to your `.env` and `.env.prod` files:

```bash
# Cloudflare R2 存储配置
CLOUDFLARE_R2_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="your-bucket-name"
CLOUDFLARE_R2_PUBLIC_URL="https://your-custom-domain.com"
```

### How to Get These Values

1. **Account ID**: Found in your Cloudflare dashboard sidebar
2. **Access Key ID & Secret**: Create R2 API tokens in Cloudflare dashboard > R2 > Manage R2 API tokens
3. **Bucket Name**: The name of your R2 bucket
4. **Public URL**: Your custom domain or the default R2 public URL

## API Endpoints

### Upload Image
- **POST** `/api/upload`
- **Headers**: `Authorization: Bearer <jwt-token>`
- **Body**: `multipart/form-data`
  - `file`: Image file (JPEG, PNG, WebP, GIF)
  - `folder`: Optional folder name (default: "images")

### Delete Image
- **DELETE** `/api/upload`
- **Headers**: `Authorization: Bearer <jwt-token>`, `Content-Type: application/json`
- **Body**: `{ "key": "folder/filename.ext" }`

## Usage in Frontend

### Basic Upload
```typescript
import { uploadFile } from '../services/uploadApi';

const handleUpload = async (file: File, token: string) => {
  try {
    const result = await uploadFile(file, 'banana-magic', token);
    console.log('Uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Upload Base64 Image
```typescript
import { uploadBase64Image } from '../services/uploadApi';

const handleBase64Upload = async (base64Data: string, token: string) => {
  try {
    const result = await uploadBase64Image(
      base64Data, 
      'generated-image.png', 
      'ai-generated', 
      token
    );
    console.log('Uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### AI Image Generation with Upload
```typescript
import { geminiApi } from '../services/geminiApi';

const generateAndUpload = async (description: string, token: string) => {
  try {
    const result = await geminiApi.generateAndUploadBananaImage(description, token);
    console.log('Generated and uploaded:', result.imageUrl);
  } catch (error) {
    console.error('Generation/upload failed:', error);
  }
};
```

## File Validation

The upload API enforces the following restrictions:
- **File Types**: JPEG, PNG, WebP, GIF only
- **File Size**: Maximum 10MB
- **Authentication**: Valid JWT token required

## Error Handling

Common error responses:
- `401`: Invalid or missing JWT token
- `400`: Invalid file type or size
- `500`: Cloudflare R2 configuration missing or upload failed

## Testing

Use the provided test script to verify the upload functionality:

```bash
cd micro-user
node test-upload.js
```

Note: You'll need to replace the test JWT token in the script with a valid token.

## Security Considerations

1. **Authentication**: All uploads require valid JWT tokens
2. **File Validation**: Only allowed file types and sizes are accepted
3. **Unique Filenames**: Files are automatically renamed to prevent conflicts
4. **Environment Variables**: Keep R2 credentials secure and never commit them to version control

## Troubleshooting

### Common Issues

1. **"Cloudflare R2 configuration missing"**
   - Ensure all required environment variables are set
   - Check that the variables are loaded correctly

2. **"Failed to upload to R2"**
   - Verify R2 API credentials are correct
   - Check bucket permissions and existence
   - Ensure the bucket allows public access if using public URLs

3. **"Invalid token"**
   - Verify JWT token is valid and not expired
   - Check JWT_SECRET environment variable

### Debug Steps

1. Check environment variables are loaded:
   ```bash
   node -e "console.log(process.env.CLOUDFLARE_R2_ACCOUNT_ID)"
   ```

2. Test API endpoint directly with curl:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-image.png" \
     -F "folder=test"
   ```

3. Check server logs for detailed error messages