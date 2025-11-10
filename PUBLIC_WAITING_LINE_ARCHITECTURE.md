# Public Waiting Line - System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Medical Practice System                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Doctor Interface│         │   Backend API    │         │  Public Display  │
│   (Authenticated)│         │  (Express + WS)  │         │ (No Auth Required)│
└──────────────────┘         └──────────────────┘         └──────────────────┘
         │                            │                            │
         │    HTTP POST               │                            │
         │  ┌────────────────┐        │                            │
         ├──┤ Add to Waiting │        │                            │
         │  └────────────────┘        │                            │
         │                            │                            │
         │                            ▼                            │
         │                   ┌────────────────┐                    │
         │                   │ Update Database│                    │
         │                   │  (PostgreSQL)  │                    │
         │                   └────────────────┘                    │
         │                            │                            │
         │                            ▼                            │
         │                   ┌────────────────┐                    │
         │                   │Trigger WebSocket│                   │
         │                   │     Update     │                    │
         │                   └────────────────┘                    │
         │                            │                            │
         │                            │  WebSocket Event           │
         │                            │  'waiting-line-update'     │
         │                            ├────────────────────────────▶
         │                            │                            │
         │                            │                            ▼
         │                            │                   ┌────────────────┐
         │                            │                   │  Update Display│
         │                            │                   │  (React State) │
         │                            │                   └────────────────┘
```

---

## 📊 Data Flow Diagram

### Scenario: Doctor Adds Patient to Waiting List

```
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Doctor Action                                               │
└─────────────────────────────────────────────────────────────────────┘

Doctor clicks "Add Patient to Waiting List"
         │
         ▼
POST /medecin/add-to-waiting-today
Headers: { Authorization: Bearer <token> }
Body: { patientId: 123 }


┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Backend Processing                                          │
└─────────────────────────────────────────────────────────────────────┘

1. Verify JWT token
         │
         ▼
2. Create appointment record
   {
     patientId: 123,
     medecinId: 456,
     date: today,
     state: 'Waiting',
     arrivalTime: now
   }
         │
         ▼
3. Save to PostgreSQL
         │
         ▼
4. Trigger WebSocket update
   triggerWaitingLineUpdate()


┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: WebSocket Broadcast                                         │
└─────────────────────────────────────────────────────────────────────┘

1. Query current patient (state = 'InProgress')
         │
         ▼
2. Query waiting patients (state = 'Waiting')
         │
         ▼
3. Format data
   {
     current: { ... },
     waiting: [ ... ],
     totalWaiting: 3
   }
         │
         ▼
4. Broadcast to ALL connected clients
   io.emit('waiting-line-update', data)


┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Public Display Update                                       │
└─────────────────────────────────────────────────────────────────────┘

1. Receive WebSocket event
         │
         ▼
2. Update React state
   setWaitingPatients(data.waiting)
         │
         ▼
3. Re-render component
         │
         ▼
4. Display shows new patient (with animation)
```

---

## 🔄 State Transitions

### Appointment State Flow

```
┌──────────────┐
│  Scheduled   │  (Future appointment)
└──────┬───────┘
       │ Doctor: "Add to Waiting"
       │ OR Walk-in arrives
       ▼
┌──────────────┐
│   Waiting    │──────────┐ WebSocket Update #1
└──────┬───────┘          │ (Add to waiting list)
       │                  │
       │ Doctor: "Start"  │
       ▼                  │
┌──────────────┐          │
│  InProgress  │──────────┤ WebSocket Update #2
└──────┬───────┘          │ (Current patient changes)
       │                  │
       │ Doctor: "Finish" │
       ▼                  │
┌──────────────┐          │
│  Completed   │──────────┘ WebSocket Update #3
└──────────────┘            (Current cleared, next up)
```

---

## 🏛️ Backend Architecture

### File Structure

```
src/
├── controllers/
│   ├── medecinController.js      # Doctor actions (authenticated)
│   │   ├── addToWaitingList()
│   │   ├── addToInProgress()
│   │   ├── finishConsultation()
│   │   └── addToWaitingListToday()
│   │
│   └── publicController.js       # Public endpoints (no auth)
│       ├── getWaitingLine()
│       └── getWaitingLineStats()
│
├── routes/
│   ├── medecin.js                # /medecin/* routes
│   └── public.js                 # /public/* routes
│
├── services/
│   └── websocketService.js       # WebSocket server
│       ├── initializeWebSocket()
│       ├── getWaitingLineData()
│       └── triggerWaitingLineUpdate()
│
├── middleware/
│   └── verifyAccessToken.js      # JWT authentication
│
└── server.js                     # Main server setup
```

### Server Initialization Flow

```
1. Load environment variables
         │
         ▼
2. Create Express app
         │
         ▼
3. Create HTTP server (for WebSocket)
         │
         ▼
4. Configure CORS
         │
         ▼
5. Register routes
   ├── /auth/*
   ├── /medecin/*  (authenticated)
   ├── /admin/*    (authenticated)
   └── /public/*   (no auth)
         │
         ▼
6. Initialize WebSocket server
   ├── Setup Socket.IO
   ├── Configure CORS for WebSocket
   └── Register event handlers
         │
         ▼
7. Start HTTP server
   ├── Listen on port 4000
   └── Accept both HTTP and WebSocket connections
```

---

## 🎨 Frontend Architecture

### Component Structure

```
PublicWaitingLine
├── State Management
│   ├── currentPatient (object|null)
│   ├── waitingPatients (array)
│   ├── loading (boolean)
│   └── currentTime (Date)
│
├── Effects
│   ├── useEffect #1: Initialize
│   │   ├── Fetch initial data (REST)
│   │   ├── Connect WebSocket
│   │   └── Setup event listeners
│   │
│   └── useEffect #2: Clock
│       └── Update time every second
│
└── Render
    ├── Header (with live clock)
    ├── Current Patient Section
    │   ├── Show if patient exists
    │   └── Empty state if none
    ├── Waiting List Section
    │   ├── Show top 3 patients
    │   ├── Position indicators
    │   └── Empty state if none
    └── Footer
```

### WebSocket Connection Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Component Mount                                              │
└─────────────────────────────────────────────────────────────────┘
   │
   ├── Fetch initial data via REST API
   │   GET /public/waiting-line
   │   └── Set initial state
   │
   └── Establish WebSocket connection
       io('ws://localhost:4000')
       │
       ├── Event: 'connect'
       │   └── Log connection
       │
       ├── Event: 'waiting-line-update'
       │   └── Update state with new data
       │
       └── Event: 'disconnect'
           └── Log disconnection


┌─────────────────────────────────────────────────────────────────┐
│ 2. While Connected                                              │
└─────────────────────────────────────────────────────────────────┘
   │
   ├── Receive automatic updates
   │   └── When doctor changes appointment states
   │
   └── Auto-reconnect if disconnected
       └── Socket.IO handles this automatically


┌─────────────────────────────────────────────────────────────────┐
│ 3. Component Unmount                                            │
└─────────────────────────────────────────────────────────────────┘
   │
   └── Cleanup: socket.disconnect()
```

---

## 🔐 Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Endpoint Type: Doctor Endpoints                                 │
└─────────────────────────────────────────────────────────────────┘

Request: POST /medecin/add-to-waiting
         │
         ▼
   ┌─────────────────┐
   │ verifyAccessToken│  ← JWT validation
   │   Middleware    │
   └────────┬────────┘
            │ Valid?
            ├── YES → Continue to controller
            │
            └── NO  → 401 Unauthorized


┌─────────────────────────────────────────────────────────────────┐
│ Endpoint Type: Public Endpoints                                 │
└─────────────────────────────────────────────────────────────────┘

Request: GET /public/waiting-line
         │
         └─→ Direct to controller (no auth)
             │
             └─→ Returns only non-sensitive data:
                 ├── Patient names
                 ├── Appointment times
                 └── Position in queue
                 
                 EXCLUDES:
                 ├── Medical information
                 ├── Phone numbers
                 ├── Addresses
                 └── Payment info
```

### Data Privacy

```
Database Record:
{
  id: 123,
  patientId: 456,
  fullName: "John Doe",
  phoneNumber: "+1234567890",      ← NOT exposed to public
  maladieChronique: "Diabetes",    ← NOT exposed to public
  note: "Patient history...",       ← NOT exposed to public
  state: "Waiting",
  arrivalTime: "2024-01-15T09:00:00Z"
}

Public API Response:
{
  id: 123,                          ← Appointment ID (safe)
  name: "John Doe",                 ← Name only
  fullName: "John Doe",
  appointmentTime: "2024-01-15T09:00:00Z",
  position: 1
}
```

---

## 💾 Database Schema

### Relevant Tables

```sql
-- RendezVous (Appointments)
CREATE TABLE RendezVous {
  id              SERIAL PRIMARY KEY,
  date            TIMESTAMP NOT NULL,
  patientId       INT NOT NULL,
  medecinId       INT NOT NULL,
  state           RendezVousState DEFAULT 'Scheduled',
  arrivalTime     TIMESTAMP,
  startTime       TIMESTAMP,
  endTime         TIMESTAMP,
  -- ... other fields
  
  FOREIGN KEY (patientId) REFERENCES Patient(id),
  FOREIGN KEY (medecinId) REFERENCES Medecin(id)
}

-- RendezVousState Enum
ENUM RendezVousState {
  Scheduled   -- Future appointment
  Waiting     -- Patient arrived, waiting
  InProgress  -- Currently in consultation
  Completed   -- Consultation finished
  Cancelled   -- Appointment cancelled
}

-- Patient
CREATE TABLE Patient {
  id              SERIAL PRIMARY KEY,
  fullName        VARCHAR NOT NULL,
  phoneNumber     VARCHAR UNIQUE,
  gender          Gender,
  dateOfBirth     DATE,
  -- ... other fields
}
```

### Key Queries

```sql
-- Get Current Patient
SELECT r.*, p.fullName 
FROM RendezVous r
JOIN Patient p ON r.patientId = p.id
WHERE r.date = CURRENT_DATE
  AND r.state = 'InProgress'
ORDER BY r.startTime ASC
LIMIT 1;

-- Get Waiting Patients
SELECT r.*, p.fullName
FROM RendezVous r
JOIN Patient p ON r.patientId = p.id
WHERE r.date = CURRENT_DATE
  AND r.state = 'Waiting'
ORDER BY r.arrivalTime ASC, r.date ASC;
```

---

## 🌐 Network Architecture

### HTTP & WebSocket Ports

```
┌──────────────────────────────────────────────┐
│         Backend Server (Port 4000)           │
├──────────────────────────────────────────────┤
│                                              │
│  HTTP Server (Express)                       │
│  ├── REST API Endpoints                      │
│  │   ├── GET /public/waiting-line           │
│  │   └── GET /public/waiting-line/stats     │
│  │                                           │
│  └── WebSocket Server (Socket.IO)           │
│      ├── Event: 'connection'                │
│      ├── Event: 'disconnect'                │
│      └── Event: 'waiting-line-update'       │
│                                              │
└──────────────────────────────────────────────┘
         │                    │
         │ HTTP               │ WebSocket
         │                    │
    ┌────▼────┐          ┌────▼────┐
    │ Browser │          │ Browser │
    │ (REST)  │          │  (WS)   │
    └─────────┘          └─────────┘
```

### CORS Configuration

```javascript
// HTTP CORS
app.use(cors({
  origin: [
    'http://localhost:3000',   // React dev server
    'http://localhost:5173',   // Vite dev server
    'http://localhost:5174'    // Alternative port
  ],
  credentials: true
}));

// WebSocket CORS
io = new Server(server, {
  cors: {
    origin: '*',               // Allow all (public display)
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 📈 Performance Characteristics

### Response Times

```
┌──────────────────────┬─────────────┬──────────────┐
│ Operation            │ Latency     │ Notes        │
├──────────────────────┼─────────────┼──────────────┤
│ REST API Call        │ 50-200ms    │ DB query     │
│ WebSocket Update     │ 10-50ms     │ Push only    │
│ DB Query (Current)   │ 10-30ms     │ Single row   │
│ DB Query (Waiting)   │ 20-100ms    │ Multiple rows│
│ Total Update Cycle   │ 100-300ms   │ End-to-end   │
└──────────────────────┴─────────────┴──────────────┘
```

### Scalability

```
┌────────────────────────┬─────────────────────────┐
│ Metric                 │ Capacity                │
├────────────────────────┼─────────────────────────┤
│ WebSocket Connections  │ 100+ concurrent         │
│ Appointments per day   │ 500+                    │
│ Database size          │ Unlimited (PostgreSQL)  │
│ Update frequency       │ Real-time (event-based) │
│ Concurrent updates     │ High (non-blocking)     │
└────────────────────────┴─────────────────────────┘
```

---

## 🔧 Technology Stack

### Backend
```
┌─────────────────────────────────────┐
│ Runtime:  Node.js                   │
│ Framework: Express.js               │
│ WebSocket: Socket.IO                │
│ Database: PostgreSQL                │
│ ORM: Prisma                         │
│ Auth: JWT (jsonwebtoken)            │
└─────────────────────────────────────┘
```

### Frontend
```
┌─────────────────────────────────────┐
│ Framework: React                    │
│ WebSocket: socket.io-client         │
│ Animation: Framer Motion            │
│ Styling: Tailwind CSS               │
│ Icons: Lucide React                 │
└─────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

### Development
```
┌──────────────────────┐
│   Local Machine      │
├──────────────────────┤
│ Backend: localhost:4000 │
│ Frontend: localhost:5173│
│ Database: PostgreSQL    │
└──────────────────────┘
```

### Production
```
┌──────────────────────────────────────┐
│         Cloud Infrastructure         │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────┐                 │
│  │  Load Balancer │                 │
│  └───────┬────────┘                 │
│          │                           │
│  ┌───────▼─────────┐                │
│  │  Backend Server │                │
│  │  (Express + WS) │                │
│  └───────┬─────────┘                │
│          │                           │
│  ┌───────▼─────────┐                │
│  │   PostgreSQL    │                │
│  │    Database     │                │
│  └─────────────────┘                │
│                                      │
└──────────────────────────────────────┘
         │
         │ HTTPS + WSS
         │
    ┌────▼─────┐
    │ Browser  │
    │ (Public) │
    └──────────┘
```

---

## ✅ System Requirements

### Server
- Node.js 16+
- PostgreSQL 12+
- 512MB RAM minimum
- 1GB disk space

### Client (Public Display)
- Modern browser (Chrome, Firefox, Edge)
- WebSocket support
- 1920x1080 display recommended
- Stable internet connection

---

## 📊 Monitoring Points

```
┌─────────────────────────────────────────────┐
│ Key Metrics to Monitor                      │
├─────────────────────────────────────────────┤
│ ✓ WebSocket connection count                │
│ ✓ Database query response times             │
│ ✓ WebSocket event frequency                 │
│ ✓ Error rates (connection failures)         │
│ ✓ API endpoint response times               │
│ ✓ Number of waiting patients                │
│ ✓ Average wait time                         │
└─────────────────────────────────────────────┘
```

---

This architecture provides a robust, real-time, and scalable solution for managing public waiting line displays in medical practices.
