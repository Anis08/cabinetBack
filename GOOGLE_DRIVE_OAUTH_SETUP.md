# Google Drive OAuth Setup Guide (Updated)

## ⚠️ Important Update

Service accounts don't have their own storage quota. We need to use **OAuth 2.0** with a regular Google account to store files in **your personal Google Drive**.

---

## 🔑 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** (or select existing)
3. Name your project (e.g., "Medical Practice Ads")
4. Click **"Create"**

### Step 2: Enable Google Drive API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Fill in required fields:
   - **App name:** Medical Practice Ads
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click **"Save and Continue"**
5. **Scopes:** Click "Add or Remove Scopes"
   - Search for "Google Drive API"
   - Select: `../auth/drive.file` (View and manage files created by this app)
6. Click **"Save and Continue"**
7. **Test users:** Add your Gmail address
8. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** Medical Ads Uploader
5. **Authorized redirect URIs:**
   - Add: `http://localhost:3000/oauth2callback`
   - Add: `http://localhost:4000/oauth2callback`
6. Click **"Create"**
7. **Save the Client ID and Client Secret!**

---

## 🔧 Generate Refresh Token

### Step 1: Set Environment Variables (Temporary)

```bash
# On Windows (PowerShell)
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"

# On Linux/Mac
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Step 2: Run Token Generation Script

```bash
cd /home/user/webapp
node scripts/generate-google-tokens.js
```

### Step 3: Follow the Instructions

The script will:
1. Display a URL - **open it in your browser**
2. Sign in with your Google account
3. Authorize the application
4. Copy the code from the URL after authorization
5. Paste it into the terminal

### Step 4: Save the Tokens

The script will output something like:
```
✅ Success! Add these to your .env file:

GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"
GOOGLE_REFRESH_TOKEN="1//0abc123def456ghi..."
```

Copy these to your `.env` file.

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

# Google Drive OAuth (Required)
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"
GOOGLE_REFRESH_TOKEN="1//0abc123def456ghi789..."
```

---

## 🧪 Test the Setup

### Test 1: Upload a File via API

```bash
curl -X POST http://localhost:4000/medecin/ads/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg"
```

**Expected Response:**
```json
{
  "message": "File uploaded successfully to Google Drive",
  "url": "https://drive.google.com/uc?export=view&id=FILE_ID",
  "fileId": "1abc123...",
  "directLink": "https://drive.google.com/uc?export=view&id=FILE_ID",
  "filename": "ad-1234567890.jpg",
  "mimetype": "image/jpeg",
  "size": 245678
}
```

### Test 2: Check Your Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Look for a folder named **"MedicalAds"**
3. You should see your uploaded file there

---

## 🔒 Security Best Practices

### 1. Keep Credentials Secure

✅ **Do:**
- Store in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables in production

❌ **Don't:**
- Commit credentials to Git
- Share credentials publicly
- Hard-code in source files

### 2. Rotate Credentials Periodically

1. Go to Google Cloud Console
2. Delete old OAuth client
3. Create new one
4. Generate new refresh token
5. Update `.env` file

### 3. Limit Scopes

Only use the `drive.file` scope - this limits access to files created by your app.

---

## 🔄 How OAuth Works

```
1. Your app requests authorization
2. User signs in with Google account
3. User grants permission
4. Google returns authorization code
5. Exchange code for access token + refresh token
6. Store refresh token in .env
7. Access token expires after 1 hour
8. Use refresh token to get new access token automatically
```

The `googleapis` library handles token refresh automatically!

---

## 📂 Where Files Are Stored

Files are stored in **your personal Google Drive** in the **"MedicalAds"** folder.

```
My Drive/
└── MedicalAds/
    ├── ad-1234567890-123.jpg
    ├── ad-1234567891-456.mp4
    └── ...
```

All files are:
- ✅ Stored in your Drive quota (15GB free)
- ✅ Set to public access (anyone with link)
- ✅ Managed by your app
- ✅ Can be manually accessed/deleted

---

## 🛠️ Troubleshooting

### Error: "credentials not configured"

**Solution:** Make sure all three environment variables are set:
```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."
```

### Error: "invalid_grant"

**Cause:** Refresh token expired or revoked

**Solution:**
1. Run `node scripts/generate-google-tokens.js` again
2. Get a new refresh token
3. Update `.env` file

### Error: "insufficient permissions"

**Cause:** Drive API not enabled

**Solution:**
1. Go to Google Cloud Console
2. Enable Google Drive API

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI not configured

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Add `http://localhost:3000/oauth2callback` to Authorized redirect URIs

### Files not appearing in Drive

**Check:**
1. Sign in to Google Drive with the same account you authorized
2. Look for "MedicalAds" folder
3. Check "Shared with me" section

---

## 💡 Alternative: Using Your Personal Account

Since files are stored in your personal Drive, consider:

### Option 1: Create Dedicated Google Account
1. Create a new Gmail account for the clinic
2. Use that account for OAuth
3. All files stored in that account's Drive

### Option 2: Use Shared Drive (Google Workspace Only)
If you have Google Workspace:
1. Create a Shared Drive
2. Grant service account access
3. Upload to Shared Drive instead

---

## 📊 Storage Limits

### Free Account
- **Storage:** 15GB (shared with Gmail and Photos)
- **File size:** Up to 5TB per file
- **Daily uploads:** Reasonable limits

### Google Workspace
- **Storage:** 30GB to unlimited (depending on plan)
- **File size:** Up to 5TB per file
- **Shared Drives:** Unlimited storage

For medical practice ads, 15GB should be sufficient for thousands of images/videos.

---

## 🔄 Migration from Service Account

If you previously set up a service account:

1. **Remove old environment variables:**
   ```env
   # Delete these:
   # GOOGLE_SERVICE_ACCOUNT_KEY="..."
   # GOOGLE_SERVICE_ACCOUNT_PATH="..."
   ```

2. **Add new OAuth variables:**
   ```env
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   GOOGLE_REFRESH_TOKEN="..."
   ```

3. **Restart server**

---

## 📞 Getting Help

### Common Issues

1. **"Access not configured"**
   - Enable Google Drive API in Cloud Console

2. **"Invalid client"**
   - Check Client ID and Secret are correct

3. **"Token has been expired or revoked"**
   - Generate new refresh token

4. **"Quota exceeded"**
   - Check Drive storage space
   - Delete old files

### Resources

- [Google Drive API Docs](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm](https://www.npmjs.com/package/googleapis)

---

## ✅ Verification Checklist

- [ ] Google Cloud Project created
- [ ] Google Drive API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Secret saved
- [ ] Refresh token generated
- [ ] All credentials in `.env` file
- [ ] Test upload successful
- [ ] Files visible in Google Drive
- [ ] Public access working

---

## 🎉 You're Ready!

Once configured:
1. ✅ Files upload to your Google Drive
2. ✅ Stored in "MedicalAds" folder
3. ✅ Publicly accessible links
4. ✅ Automatic token refresh
5. ✅ No server storage needed

**Start uploading ads!** 🚀
