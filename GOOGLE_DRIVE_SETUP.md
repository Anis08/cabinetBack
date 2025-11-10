# Google Drive API Setup Guide

## 📋 Overview

The advertisement management system now stores files in **Google Drive** instead of local storage. This provides:
- ✅ Unlimited storage (within Google Drive limits)
- ✅ Reliable file hosting
- ✅ Public URL access
- ✅ Better scalability
- ✅ No server storage needed

---

## 🔑 Setting Up Google Drive API

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give your project a name (e.g., "Medical Practice Ads")
4. Click **"Create"**

### Step 2: Enable Google Drive API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and click **"Enable"**

### Step 3: Create Service Account

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in the details:
   - **Service account name:** `medical-ads-uploader`
   - **Service account ID:** (auto-generated)
   - **Description:** `Service account for uploading medical advertisements`
4. Click **"Create and Continue"**
5. **Grant this service account access to project:**
   - Skip this step (click "Continue")
6. **Grant users access to this service account:**
   - Skip this step (click "Done")

### Step 4: Create Service Account Key

1. In **"Credentials"**, find your newly created service account
2. Click on it to open details
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Choose **"JSON"** format
6. Click **"Create"**
7. A JSON file will be downloaded - **KEEP THIS FILE SAFE!**

---

## 🔧 Configuration

### Method 1: Using Base64 Encoded Key (Recommended for Production)

1. **Convert JSON to Base64:**
   ```bash
   # Linux/Mac
   base64 -i service-account-key.json
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account-key.json"))
   ```

2. **Add to .env file:**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-json-key>
   ```

### Method 2: Using JSON File Path (Easier for Development)

1. **Place the JSON file in your project:**
   ```bash
   mkdir -p config
   mv ~/Downloads/service-account-key.json config/google-service-account.json
   ```

2. **Add to .env file:**
   ```env
   GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
   ```

3. **Add to .gitignore:**
   ```
   config/google-service-account.json
   ```

---

## 📝 Complete .env Configuration

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Server
PORT=4000

# JWT
JWT_SECRET="your-jwt-secret-key"
REFRESH_SECRET="your-refresh-secret-key"

# Google Drive (Choose ONE method)
# Method 1: Base64 encoded key (Production)
GOOGLE_SERVICE_ACCOUNT_KEY="ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC..."

# Method 2: File path (Development)
# GOOGLE_SERVICE_ACCOUNT_PATH="./config/google-service-account.json"
```

---

## 🧪 Testing the Setup

### Test 1: Check Service is Working

Create a test script `test-drive.js`:

```javascript
import { uploadToGoogleDrive } from './src/services/googleDriveService.js';
import fs from 'fs';

async function test() {
  try {
    // Create a test buffer
    const testBuffer = Buffer.from('Hello Google Drive!');
    
    const result = await uploadToGoogleDrive(
      testBuffer,
      'test-file.txt',
      'text/plain'
    );
    
    console.log('✅ Upload successful!');
    console.log('File ID:', result.fileId);
    console.log('Direct Link:', result.directLink);
    console.log('URL:', result.url);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

test();
```

Run the test:
```bash
node test-drive.js
```

### Test 2: Upload via API

```bash
# Upload a file
curl -X POST http://localhost:4000/medecin/ads/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# Expected response:
{
  "message": "File uploaded successfully to Google Drive",
  "url": "https://drive.google.com/uc?export=view&id=FILE_ID",
  "fileId": "1abc123...",
  "directLink": "https://drive.google.com/uc?export=view&id=FILE_ID",
  "webViewLink": "https://drive.google.com/file/d/FILE_ID/view",
  "filename": "ad-1234567890-123456789.jpg",
  "mimetype": "image/jpeg",
  "size": 245678
}
```

---

## 📂 Google Drive Folder Structure

The service automatically creates a folder structure:

```
My Drive/
└── MedicalAds/
    ├── ad-1234567890-123.jpg
    ├── ad-1234567891-456.jpg
    ├── ad-1234567892-789.mp4
    └── ...
```

All uploaded files are stored in the **"MedicalAds"** folder with public access.

---

## 🔗 URL Formats

Google Drive provides multiple URL formats:

### 1. Direct Link (Used by the API)
```
https://drive.google.com/uc?export=view&id=FILE_ID
```
✅ Best for embedding in `<img>` and `<video>` tags

### 2. Web View Link
```
https://drive.google.com/file/d/FILE_ID/view
```
✅ Opens file in Google Drive viewer

### 3. Web Content Link
```
https://drive.google.com/uc?id=FILE_ID&export=download
```
✅ Direct download link

---

## 🔒 Security & Permissions

### File Permissions

All uploaded files are set to:
- **Role:** Reader
- **Type:** Anyone (public)

This allows files to be accessed without authentication, which is necessary for:
- Public waiting line display
- Embedding in web pages
- Direct `<img>` and `<video>` tag usage

### Service Account Security

- ✅ Service account only has access to files it uploads
- ✅ JSON key should be kept secure (never commit to Git)
- ✅ Use environment variables for production
- ✅ Rotate keys periodically

### Rate Limits

Google Drive API has quotas:
- **Queries per day:** 1,000,000,000
- **Queries per 100 seconds per user:** 1,000
- **Queries per 100 seconds:** 10,000

For medical practice ads, these limits are more than sufficient.

---

## 🛠️ Troubleshooting

### Error: "Google Drive credentials not configured"

**Cause:** Environment variable not set

**Solution:**
```bash
# Check if variable is set
echo $GOOGLE_SERVICE_ACCOUNT_KEY
# or
echo $GOOGLE_SERVICE_ACCOUNT_PATH

# Add to .env file
GOOGLE_SERVICE_ACCOUNT_KEY="your-base64-key"
```

### Error: "Invalid grant"

**Cause:** Service account key is invalid or expired

**Solution:**
1. Delete the old key in Google Cloud Console
2. Create a new key
3. Update your .env file

### Error: "Insufficient permissions"

**Cause:** Google Drive API not enabled

**Solution:**
1. Go to Google Cloud Console
2. Enable Google Drive API for your project

### Error: "File not found" when deleting

**Cause:** File ID extraction failed or file already deleted

**Solution:** This is handled gracefully - the ad will be deleted from database even if Drive deletion fails.

### Files not appearing in "MedicalAds" folder

**Cause:** Folder creation failed or multiple folders exist

**Solution:**
1. Manually create "MedicalAds" folder in Google Drive
2. Share it with your service account email
3. Or delete duplicate folders

---

## 📊 Monitoring & Logs

### Check Upload Logs

```bash
# Server logs show:
✅ File uploaded to Google Drive: ad-123.jpg (ID: 1abc...)
✅ Deleted file from Google Drive: 1abc...
```

### Monitor Google Drive Usage

1. Go to [Google Drive](https://drive.google.com)
2. Check the "MedicalAds" folder
3. View storage usage in settings

### API Usage Monitoring

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** > **"Dashboard"**
3. View Google Drive API usage metrics

---

## 🔄 Migration from Local Storage

If you have existing ads with local file paths:

### Option 1: Manual Migration Script

```javascript
import { prisma } from './src/prisma.js';
import { uploadToGoogleDrive } from './src/services/googleDriveService.js';
import fs from 'fs';
import path from 'path';

async function migrateToGoogleDrive() {
  const ads = await prisma.advertisement.findMany();
  
  for (const ad of ads) {
    if (ad.fileUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, ad.fileUrl);
      
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        const fileName = path.basename(localPath);
        const mimeType = getMimeType(fileName);
        
        const result = await uploadToGoogleDrive(buffer, fileName, mimeType);
        
        await prisma.advertisement.update({
          where: { id: ad.id },
          data: { fileUrl: result.url }
        });
        
        console.log(`✅ Migrated: ${ad.title}`);
      }
    }
  }
}

migrateToGoogleDrive();
```

### Option 2: Update Frontend to Re-upload

Simply edit and re-upload files through the UI.

---

## 💡 Best Practices

### 1. File Naming
- Use timestamps and random strings for uniqueness
- Include file extension for proper MIME type detection

### 2. Error Handling
- Always wrap Drive operations in try-catch
- Log errors for debugging
- Continue with database operations even if Drive fails

### 3. Cleanup
- Delete files from Drive when ads are deleted
- Periodically check for orphaned files

### 4. Security
- Never commit service account keys
- Use environment variables
- Rotate keys every 90 days
- Monitor API usage

### 5. Testing
- Test uploads with different file types
- Test file deletion
- Test public access to URLs
- Monitor response times

---

## 📚 Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## ✅ Verification Checklist

- [ ] Google Cloud Project created
- [ ] Google Drive API enabled
- [ ] Service Account created
- [ ] Service Account key downloaded
- [ ] Key added to .env file (base64 or file path)
- [ ] googleapis package installed (`npm install googleapis`)
- [ ] Test upload successful
- [ ] Files appear in Google Drive
- [ ] Files are publicly accessible
- [ ] Delete operation works
- [ ] API endpoints return Google Drive URLs

---

## 🎉 You're Ready!

Once configured, files will automatically:
1. ✅ Upload to Google Drive
2. ✅ Store in "MedicalAds" folder
3. ✅ Be publicly accessible
4. ✅ Return direct links for embedding
5. ✅ Delete from Drive when ad is removed

**No local storage needed!** 🚀
