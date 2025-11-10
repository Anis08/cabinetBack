# Public Waiting Line - Quick Start Guide

## 🎯 What You Get

A real-time public waiting line display that shows:
- ✅ Current patient in consultation
- ✅ Queue of waiting patients
- ✅ Automatic updates via WebSocket
- ✅ No authentication required

Perfect for waiting room TV displays! 📺

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Start the Server
```bash
cd /home/user/webapp
npm run dev
```

You should see:
```
Server running on port 4000
WebSocket server running on ws://localhost:4000
```

### Step 2: Test the API
```bash
# Test REST endpoint
curl http://localhost:4000/public/waiting-line

# Expected response:
{
  "current": null,
  "waiting": [],
  "totalWaiting": 0,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Step 3: Add the Component to Your React App

Copy the provided `PublicWaitingLine.jsx` component to your React project, or use this minimal version:

```javascript
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const WaitingLine = () => {
  const [current, setCurrent] = useState(null);
  const [waiting, setWaiting] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetch('http://localhost:4000/public/waiting-line')
      .then(res => res.json())
      .then(data => {
        setCurrent(data.current);
        setWaiting(data.waiting);
      });

    // Setup WebSocket
    const socket = io('ws://localhost:4000');
    
    socket.on('waiting-line-update', (data) => {
      setCurrent(data.current);
      setWaiting(data.waiting);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h1>Current: {current?.fullName || 'None'}</h1>
      <h2>Waiting ({waiting.length}):</h2>
      {waiting.map((p, i) => (
        <div key={p.id}>{i + 1}. {p.fullName}</div>
      ))}
    </div>
  );
};

export default WaitingLine;
```

---

## 🎨 Using the Full Component

The complete component includes:
- Beautiful animations
- Live clock
- Patient position indicators
- Smooth transitions
- Professional styling

Just copy `PublicWaitingLine.jsx` and import it:
```javascript
import PublicWaitingLine from './PublicWaitingLine';

function App() {
  return <PublicWaitingLine />;
}
```

---

## 📡 How It Works

### Automatic Updates

The waiting line updates automatically when a doctor:

1. **Adds Patient to Waiting List**
   ```
   Doctor clicks "Add to Waiting" 
   → WebSocket sends update 
   → Display shows new patient
   ```

2. **Starts Consultation**
   ```
   Doctor clicks "Start Consultation"
   → Patient moves from waiting to current
   → Display updates instantly
   ```

3. **Completes Consultation**
   ```
   Doctor clicks "Finish"
   → Current patient cleared
   → Next patient moves up
   → Display updates
   ```

### Data Flow
```
Doctor Action
    ↓
Backend Updates Database
    ↓
Triggers WebSocket Event
    ↓
Public Display Updates
```

---

## 🔧 Configuration

### Change Backend URL

In your React component config file:
```javascript
// config.js
export const baseURL = 'http://localhost:4000';

// Or for production:
export const baseURL = 'https://api.yourdomain.com';
```

### Change Port

In `.env` file:
```
PORT=4000
```

Then restart server.

---

## 🧪 Testing the System

### 1. Add a Patient to Waiting List
Use the doctor interface or API:
```bash
curl -X POST http://localhost:4000/medecin/add-to-waiting-today \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId": 1}'
```

✅ **Expected:** Patient appears in waiting list on display

### 2. Start a Consultation
```bash
curl -X POST http://localhost:4000/medecin/add-to-actif \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rendezVousId": 123}'
```

✅ **Expected:** Patient moves to "Current" section

### 3. Finish Consultation
```bash
curl -X POST http://localhost:4000/medecin/finish-consultation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rendezVousId": 123, "paye": 100}'
```

✅ **Expected:** Current patient cleared, next patient moves up

---

## 📊 API Reference

### REST Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/public/waiting-line` | GET | None | Get current state |
| `/public/waiting-line/stats` | GET | None | Get statistics |

### WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `connect` | Server → Client | Connection established |
| `waiting-line-update` | Server → Client | New waiting line data |
| `refresh-waiting-line` | Client → Server | Request manual refresh |

---

## 🐛 Troubleshooting

### Display Not Updating

**Problem:** Changes don't appear on display

**Solutions:**
1. Check WebSocket connection in console
2. Verify server is running
3. Check CORS settings
4. Try manual refresh: Press F5

### WebSocket Connection Failed

**Problem:** Console shows connection errors

**Solutions:**
1. Verify server URL is correct
2. Check server is running on correct port
3. Try using polling transport:
   ```javascript
   io(url, { transports: ['polling'] })
   ```

### Empty Waiting Line

**Problem:** Always shows no patients

**Solutions:**
1. Check appointments exist in database
2. Verify appointment state is `Waiting` or `InProgress`
3. Check dates match today
4. Use REST API to debug:
   ```bash
   curl http://localhost:4000/public/waiting-line
   ```

---

## 📱 Deployment Tips

### For Waiting Room TV

1. **Full Screen Mode:** Press F11 in browser
2. **Auto Refresh:** Component handles this automatically
3. **Prevent Sleep:** Use browser extension or system settings
4. **Hide Cursor:** Use CSS: `* { cursor: none; }`

### For Multiple Locations

Use the same backend for multiple displays:
```javascript
// Location A
const baseURL = 'https://api.clinic.com';

// Location B (same URL)
const baseURL = 'https://api.clinic.com';
```

Each display shows the same real-time data!

---

## 🎨 Customization

### Change Colors

Edit the component CSS:
```javascript
// Change gradient
className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900"

// To:
className="bg-gradient-to-br from-green-900 via-green-800 to-green-900"
```

### Change Language

Replace French text with your language:
```javascript
// Before
<h1>File d'Attente</h1>
<span>EN CONSULTATION</span>
<span>Patients en Attente</span>

// After (English)
<h1>Waiting Line</h1>
<span>IN CONSULTATION</span>
<span>Waiting Patients</span>
```

### Show More/Fewer Patients

```javascript
// Show top 5 instead of 3
{waitingPatients.slice(0, 5).map((patient, index) => (
  // ...
))}
```

---

## 📦 What Was Installed

New dependencies:
```json
{
  "socket.io": "^4.x.x"  // Server-side WebSocket
}
```

Frontend needs:
```json
{
  "socket.io-client": "^4.x.x"  // Client-side WebSocket
}
```

---

## 📁 Files Added

| File | Purpose |
|------|---------|
| `src/controllers/publicController.js` | Public API logic |
| `src/routes/public.js` | Route definitions |
| `src/services/websocketService.js` | WebSocket server |
| `PUBLIC_WAITING_LINE_API.md` | Full documentation |

| Files Modified | Changes |
|----------------|---------|
| `src/server.js` | Added WebSocket support |
| `src/controllers/medecinController.js` | Added WebSocket triggers |
| `package.json` | Added socket.io |

---

## ✅ Checklist

Before going live:

- [ ] Server running and accessible
- [ ] WebSocket connecting successfully
- [ ] Display shows in full screen
- [ ] Test with real appointment flow
- [ ] Configure auto-start on boot (for dedicated display)
- [ ] Set up monitoring/alerts
- [ ] Hide sensitive patient information if needed

---

## 🎯 Next Steps

1. **Test the system** with real doctor workflows
2. **Customize styling** to match your clinic branding
3. **Add translations** if needed
4. **Deploy to production** server
5. **Set up dedicated display** in waiting room

---

## 📚 Full Documentation

For complete API reference and advanced features:
- **Full API Docs:** `PUBLIC_WAITING_LINE_API.md`
- **Implementation Details:** See source files

---

## 🎉 You're Ready!

Your public waiting line system is now functional with:
- ✅ Real-time updates
- ✅ Professional display
- ✅ Automatic synchronization
- ✅ No authentication needed

Just start your server and launch the display! 🚀

---

## 💡 Pro Tips

1. **Dedicated Device:** Use a cheap tablet or TV stick for the display
2. **Auto-Start:** Configure browser to auto-load the page on boot
3. **Backup Display:** Keep a paper backup system just in case
4. **Test Regularly:** Verify system works during quiet hours
5. **Monitor Uptime:** Set up alerts if WebSocket disconnects

Happy displaying! 📺✨
