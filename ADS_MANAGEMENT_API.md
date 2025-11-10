# Ads Management API Documentation

## 🎯 Overview

The Ads Management API allows doctors to manage advertisements displayed on the public waiting line screen. Ads can be images or videos with configurable duration, position, and active date ranges.

---

## 📊 Database Schema

### Advertisement Model

```prisma
model Advertisement {
  id          Int         @id @default(autoincrement())
  medecinId   Int
  title       String
  type        AdType      // 'image' or 'video'
  fileUrl     String
  dateFrom    DateTime
  dateTo      DateTime
  duration    Int         @default(5) // seconds
  position    AdPosition  @default(top) // 'top' or 'bottom'
  active      Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  medecin Medecin @relation(fields: [medecinId], references: [id])
}

enum AdType {
  image
  video
}

enum AdPosition {
  top
  bottom
}
```

---

## 🚀 API Endpoints

### 1. Get All Advertisements

**Endpoint:** `GET /medecin/ads`  
**Authentication:** Required (JWT)

#### Request
```bash
curl -X GET http://localhost:4000/medecin/ads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response (200 OK)
```json
{
  "ads": [
    {
      "id": 1,
      "medecinId": 1,
      "title": "Summer Promotion",
      "type": "image",
      "fileUrl": "/uploads/ads/ad-1234567890.jpg",
      "dateFrom": "2024-01-01T00:00:00.000Z",
      "dateTo": "2024-12-31T23:59:59.000Z",
      "duration": 5,
      "position": "top",
      "active": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 2. Get Advertisement by ID

**Endpoint:** `GET /medecin/ads/:id`  
**Authentication:** Required (JWT)

#### Request
```bash
curl -X GET http://localhost:4000/medecin/ads/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response (200 OK)
```json
{
  "id": 1,
  "medecinId": 1,
  "title": "Summer Promotion",
  "type": "image",
  "fileUrl": "/uploads/ads/ad-1234567890.jpg",
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-12-31T23:59:59.000Z",
  "duration": 5,
  "position": "top",
  "active": true,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

---

### 3. Upload Ad File

**Endpoint:** `POST /medecin/ads/upload`  
**Authentication:** Required (JWT)  
**Content-Type:** `multipart/form-data`

#### Request
```bash
curl -X POST http://localhost:4000/medecin/ads/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

#### Supported File Types
- **Images:** .jpg, .jpeg, .png, .gif, .webp
- **Videos:** .mp4, .webm, .ogg

#### File Size Limit
- Maximum: 50MB

#### Response (200 OK)
```json
{
  "message": "File uploaded successfully",
  "url": "/uploads/ads/ad-1234567890.jpg",
  "filename": "ad-1234567890.jpg",
  "mimetype": "image/jpeg",
  "size": 245678
}
```

---

### 4. Create Advertisement

**Endpoint:** `POST /medecin/ads`  
**Authentication:** Required (JWT)

#### Request Body
```json
{
  "title": "Summer Promotion",
  "type": "image",
  "fileUrl": "/uploads/ads/ad-1234567890.jpg",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "duration": 5,
  "position": "top",
  "active": true
}
```

#### Field Descriptions
- `title` (string, required): Advertisement title
- `type` (string, required): "image" or "video"
- `fileUrl` (string, required): URL of uploaded file
- `dateFrom` (string, required): Start date (ISO 8601)
- `dateTo` (string, required): End date (ISO 8601)
- `duration` (number, optional): Display duration in seconds (default: 5)
- `position` (string, optional): "top" or "bottom" (default: "top")
- `active` (boolean, optional): Active status (default: true)

#### Response (201 Created)
```json
{
  "message": "Advertisement created successfully",
  "ad": {
    "id": 1,
    "medecinId": 1,
    "title": "Summer Promotion",
    "type": "image",
    "fileUrl": "/uploads/ads/ad-1234567890.jpg",
    "dateFrom": "2024-01-01T00:00:00.000Z",
    "dateTo": "2024-12-31T23:59:59.000Z",
    "duration": 5,
    "position": "top",
    "active": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

---

### 5. Update Advertisement

**Endpoint:** `PUT /medecin/ads/:id`  
**Authentication:** Required (JWT)

#### Request Body
```json
{
  "title": "Updated Promotion",
  "active": false,
  "duration": 10
}
```

All fields are optional. Only provided fields will be updated.

#### Response (200 OK)
```json
{
  "message": "Advertisement updated successfully",
  "ad": {
    "id": 1,
    "title": "Updated Promotion",
    "active": false,
    "duration": 10,
    ...
  }
}
```

---

### 6. Delete Advertisement

**Endpoint:** `DELETE /medecin/ads/:id`  
**Authentication:** Required (JWT)

#### Request
```bash
curl -X DELETE http://localhost:4000/medecin/ads/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response (200 OK)
```json
{
  "message": "Advertisement deleted successfully"
}
```

**Note:** This also deletes the associated file from the server.

---

### 7. Get Active Advertisements (Public)

**Endpoint:** `GET /public/ads`  
**Authentication:** None (Public)

#### Request
```bash
curl -X GET http://localhost:4000/public/ads
```

#### Response (200 OK)
```json
{
  "ads": [
    {
      "id": 1,
      "title": "Summer Promotion",
      "type": "image",
      "fileUrl": "/uploads/ads/ad-1234567890.jpg",
      "duration": 5,
      "position": "top"
    }
  ],
  "total": 1
}
```

**Note:** Only returns ads that are:
- `active: true`
- Current date is between `dateFrom` and `dateTo`

---

## 🔒 Authentication

All endpoints (except public) require JWT authentication:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

If token is invalid or expired, you'll receive:
```json
{
  "message": "Unauthorized"
}
```

---

## 📁 File Upload Flow

### Complete Flow

```javascript
// 1. Upload file first
const formData = new FormData();
formData.append('file', file);

const uploadResponse = await fetch(`${baseURL}/medecin/ads/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { url } = await uploadResponse.json();

// 2. Create ad with uploaded file URL
const adResponse = await fetch(`${baseURL}/medecin/ads`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Ad',
    type: 'image',
    fileUrl: url, // Use the URL from upload response
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    duration: 5,
    position: 'top',
    active: true
  })
});
```

---

## 🎨 Frontend Integration

### React Example

```javascript
import { useState } from 'react';
import { baseURL } from '../config';
import { useAuth } from '../store/AuthProvider';

const AdsManagement = () => {
  const [ads, setAds] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadAds = async () => {
    const response = await fetch(`${baseURL}/medecin/ads`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setAds(data.ads);
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const response = await fetch(`${baseURL}/medecin/ads/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      return data.url;
    } finally {
      setUploading(false);
    }
  };

  const createAd = async (adData) => {
    const response = await fetch(`${baseURL}/medecin/ads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adData)
    });
    
    if (response.ok) {
      loadAds();
    }
  };

  const deleteAd = async (id) => {
    await fetch(`${baseURL}/medecin/ads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    loadAds();
  };

  return (
    // Your UI here
  );
};
```

---

## 🗄️ Database Migration

To add the Advertisement table to your database:

```bash
# Run migration
npx prisma migrate dev --name add_advertisements

# Generate Prisma Client
npx prisma generate
```

---

## 📂 File Structure

```
src/
├── controllers/
│   └── adsController.js       # Ad management logic
├── routes/
│   ├── ads.js                 # Ad routes
│   └── public.js              # Public routes (includes ads)
└── server.js                  # Updated with /uploads route

uploads/
└── ads/                       # Uploaded ad files stored here
```

---

## ⚠️ Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "message": "Missing required fields: title, type, fileUrl, dateFrom, dateTo"
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "message": "Advertisement not found"
}
```

#### 500 Server Error
```json
{
  "message": "Failed to create advertisement",
  "error": "Detailed error message"
}
```

---

## 🧪 Testing

### Test with cURL

```bash
# 1. Upload a file
curl -X POST http://localhost:4000/medecin/ads/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"

# 2. Create an ad
curl -X POST http://localhost:4000/medecin/ads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ad",
    "type": "image",
    "fileUrl": "/uploads/ads/ad-123.jpg",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "duration": 5,
    "position": "top",
    "active": true
  }'

# 3. Get all ads
curl -X GET http://localhost:4000/medecin/ads \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get public ads (no auth needed)
curl -X GET http://localhost:4000/public/ads
```

---

## 🔧 Configuration

### Environment Variables

No special environment variables needed. The system uses:
- Uploaded files stored in `uploads/ads/`
- Files served at `/uploads/ads/`

### CORS Settings

Update `src/server.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'your-domain.com'],
  credentials: true
}));
```

---

## 🎯 Features

- ✅ Upload images and videos
- ✅ Set active date ranges
- ✅ Configure display duration
- ✅ Position ads (top/bottom)
- ✅ Enable/disable ads
- ✅ Public API for active ads
- ✅ Automatic file cleanup on delete
- ✅ JWT authentication
- ✅ File size limits (50MB)
- ✅ MIME type validation

---

## 📊 Ad Display Logic

Ads are considered "active" when:
1. `active` field is `true`
2. Current date >= `dateFrom`
3. Current date <= `dateTo`

The public endpoint (`GET /public/ads`) automatically filters ads based on these criteria.

---

## 🚀 Deployment Notes

1. **Create uploads directory:**
   ```bash
   mkdir -p uploads/ads
   ```

2. **Set proper permissions:**
   ```bash
   chmod 755 uploads/ads
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Configure reverse proxy (Nginx example):**
   ```nginx
   location /uploads {
       alias /path/to/your/app/uploads;
   }
   ```

---

## ✅ Status

**Implementation:** ✅ COMPLETE  
**Documentation:** ✅ COMPLETE  
**Testing:** ⏳ Ready for testing  
**Database:** ⏳ Migration needed

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Verify JWT token is valid
3. Check file permissions in uploads directory
4. Review server logs for errors

Happy advertising! 🎉
