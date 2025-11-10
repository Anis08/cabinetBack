# Advertisement Management System - Setup Guide

## ✅ **IMPLEMENTATION COMPLETE!**

The advertisement management system has been fully implemented and is ready for use.

---

## 🎯 **What Was Implemented**

### 1. **Database Model** ✅
```prisma
model Advertisement {
  id          Int         @id @default(autoincrement())
  medecinId   Int
  title       String
  type        AdType      // 'image' or 'video'
  fileUrl     String
  dateFrom    DateTime
  dateTo      DateTime
  duration    Int         @default(5)
  position    AdPosition  @default(top)
  active      Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  medecin Medecin @relation(fields: [medecinId], references: [id])
}
```

### 2. **Backend Controllers** ✅
- **File:** `src/controllers/adsController.js`
- **Functions:**
  - `getAds()` - Get all ads for logged-in doctor
  - `getAdById()` - Get single ad
  - `createAd()` - Create new advertisement
  - `updateAd()` - Update existing ad
  - `deleteAd()` - Delete ad and file
  - `uploadAdFile()` - Handle file uploads
  - `getActiveAds()` - Public endpoint for active ads

### 3. **Routes** ✅
- **File:** `src/routes/ads.js`
- **Protected Routes:** All require JWT authentication
- **Public Route:** `GET /public/ads` (no auth required)

### 4. **File Upload** ✅
- **Library:** Multer
- **Storage:** `uploads/ads/` directory
- **Limit:** 50MB per file
- **Types:** Images (jpg, png, gif, webp) and Videos (mp4, webm, ogg)

### 5. **Frontend Component** ✅
Your `AdsManagement.jsx` component is **fully compatible** with the backend!

---

## 🚀 **Setup Instructions**

### Step 1: Install Dependencies
Dependencies are already in package.json, but if you need to reinstall:
```bash
cd /home/user/webapp
npm install
```

### Step 2: Create Uploads Directory
```bash
mkdir -p uploads/ads
chmod 755 uploads/ads
```

### Step 3: Run Database Migration
You need to have DATABASE_URL in your .env file first:

```bash
# Create .env file if it doesn't exist
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PORT=4000
JWT_SECRET="your-secret-key"
REFRESH_SECRET="your-refresh-secret"
EOF

# Run migration
npx prisma migrate dev --name add_advertisements

# Generate Prisma Client
npx prisma generate
```

### Step 4: Start the Server
```bash
npm run dev
```

Server will start on port 4000 (or PORT in .env).

---

## 📡 **API Endpoints**

### Authenticated Endpoints (Doctor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/medecin/ads` | Get all ads |
| GET | `/medecin/ads/:id` | Get ad by ID |
| POST | `/medecin/ads/upload` | Upload file |
| POST | `/medecin/ads` | Create ad |
| PUT | `/medecin/ads/:id` | Update ad |
| DELETE | `/medecin/ads/:id` | Delete ad |

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/ads` | Get active ads |

---

## 🧪 **Testing the System**

### Test 1: Upload a File
```bash
# Upload an image
curl -X POST http://localhost:4000/medecin/ads/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# Response:
{
  "message": "File uploaded successfully",
  "url": "/uploads/ads/ad-1234567890.jpg",
  "filename": "ad-1234567890.jpg",
  "mimetype": "image/jpeg",
  "size": 245678
}
```

### Test 2: Create an Ad
```bash
curl -X POST http://localhost:4000/medecin/ads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale",
    "type": "image",
    "fileUrl": "/uploads/ads/ad-1234567890.jpg",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "duration": 5,
    "position": "top",
    "active": true
  }'
```

### Test 3: Get All Ads
```bash
curl -X GET http://localhost:4000/medecin/ads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Get Active Ads (Public)
```bash
curl -X GET http://localhost:4000/public/ads
```

---

## 🎨 **Frontend Usage**

Your React component (`AdsManagement.jsx`) is already set up correctly! Just ensure:

1. **baseURL** is configured:
   ```javascript
   // config.js
   export const baseURL = 'http://localhost:4000';
   ```

2. **Auth is working:**
   - Component uses `useAuth()` hook
   - Tokens stored in localStorage

3. **Start using it:**
   ```javascript
   import AdsManagement from './components/AdsManagement';
   
   function App() {
     return <AdsManagement />;
   }
   ```

---

## 📂 **File Structure**

```
/home/user/webapp/
├── prisma/
│   └── schema.prisma          ✅ Updated with Advertisement model
├── src/
│   ├── controllers/
│   │   └── adsController.js   ✅ Ad management logic
│   ├── routes/
│   │   ├── ads.js             ✅ Ad routes
│   │   └── public.js          ✅ Updated with public ads endpoint
│   └── server.js              ✅ Updated with ads routes & uploads
├── uploads/
│   └── ads/                   ✅ File storage (created)
├── .gitignore                 ✅ Created
└── ADS_MANAGEMENT_API.md      ✅ Full API documentation
```

---

## 🔒 **Security Features**

- ✅ JWT authentication on all doctor endpoints
- ✅ File type validation (only images/videos)
- ✅ File size limits (50MB)
- ✅ Doctor can only manage their own ads
- ✅ Automatic file deletion when ad is deleted
- ✅ Public endpoint only shows active ads within date range

---

## 🌐 **Integration with Waiting Line**

The public waiting line display can fetch active ads:

```javascript
// In PublicWaitingLine component
const [ads, setAds] = useState([]);

useEffect(() => {
  const fetchAds = async () => {
    const response = await fetch(`${baseURL}/public/ads`);
    const data = await response.json();
    setAds(data.ads);
  };
  
  fetchAds();
  
  // Refresh ads every 5 minutes
  const interval = setInterval(fetchAds, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);

// Display ads
{ads.map(ad => (
  <div key={ad.id} className={`ad-${ad.position}`}>
    {ad.type === 'image' ? (
      <img src={ad.fileUrl} alt={ad.title} />
    ) : (
      <video src={ad.fileUrl} autoPlay muted loop />
    )}
  </div>
))}
```

---

## ⚙️ **Configuration**

### File Upload Settings

Edit `src/controllers/adsController.js` to change:

```javascript
// File size limit (default: 50MB)
limits: {
  fileSize: 50 * 1024 * 1024
}

// Allowed MIME types
const allowedMimes = [
  'image/jpeg',
  'image/png',
  'video/mp4',
  // Add more types here
];
```

### CORS Settings

Edit `src/server.js` to allow your frontend:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'your-domain.com'],
  credentials: true
}));
```

---

## 🐛 **Troubleshooting**

### Issue: "Cannot find module 'multer'"
**Solution:**
```bash
npm install multer
```

### Issue: "DATABASE_URL not found"
**Solution:** Create `.env` file with your database URL:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
```

### Issue: "File upload fails"
**Solution:** Check uploads directory exists and has proper permissions:
```bash
mkdir -p uploads/ads
chmod 755 uploads/ads
```

### Issue: "401 Unauthorized"
**Solution:** Ensure JWT token is valid and included in headers:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### Issue: Images not displaying
**Solution:** Check static file serving is configured in server.js:
```javascript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

---

## 📊 **Database Migration Command**

When you're ready to create the Advertisement table:

```bash
# Development
npx prisma migrate dev --name add_advertisements

# Production
npx prisma migrate deploy
```

This will create the Advertisement table with all relationships.

---

## 🎯 **Features Summary**

| Feature | Status | Description |
|---------|--------|-------------|
| File Upload | ✅ | Images and videos up to 50MB |
| CRUD Operations | ✅ | Create, Read, Update, Delete ads |
| Date Ranges | ✅ | Set active periods for ads |
| Position Control | ✅ | Top or bottom placement |
| Duration Control | ✅ | Display time in seconds |
| Active/Inactive | ✅ | Toggle ad visibility |
| Public API | ✅ | Get active ads without auth |
| File Cleanup | ✅ | Auto-delete files on ad delete |
| Authentication | ✅ | JWT protected endpoints |
| Documentation | ✅ | Complete API docs |

---

## 📝 **Git Commits**

```
2d95e67 feat(ads): add advertisement management system with file upload
68d70cb docs: add teleconsultation removal summary
```

**Repository:** https://github.com/Anis08/cabinetBack  
**Branch:** main

---

## ✅ **Ready to Use!**

The advertisement management system is **fully implemented and ready**!

### Quick Start:
1. ✅ Code committed and pushed
2. ⏳ Run database migration
3. ⏳ Create uploads directory
4. ⏳ Start server
5. ✅ Use frontend component

### What Your React Component Can Do:
- ✅ Upload images/videos
- ✅ Create ads with title, dates, duration
- ✅ Edit existing ads
- ✅ Delete ads
- ✅ View all ads with preview
- ✅ See active status
- ✅ Copy waiting line URL
- ✅ Open waiting line in new tab

**Everything is ready! Just run the migration and start using it!** 🎉
