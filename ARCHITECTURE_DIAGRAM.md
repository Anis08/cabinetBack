# Biological Requests System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                  BiologicalDataSection.jsx                           │
├─────────────────────────────────────────────────────────────────────┤
│  Features:                                                           │
│  • Create biological requests (sample types + exams)                 │
│  • Display requests in table format                                  │
│  • Edit and update results                                           │
│  • Compare results with normal ranges                                │
│  • Status tracking (En cours / Complété)                             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ HTTP Requests (JWT Auth)
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      BACKEND (Express.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Routes (/src/routes/medecin.js)                    │  │
│  │                                                               │  │
│  │  GET    /medecin/biological-requests/:patientId             │  │
│  │  POST   /medecin/biological-requests                        │  │
│  │  PUT    /medecin/biological-requests/:requestId             │  │
│  │                                                               │  │
│  │  Middleware: verifyAccessToken (JWT)                        │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
│  ┌────────────────────▼─────────────────────────────────────────┐  │
│  │      Controllers (/src/controllers/medecinController.js)     │  │
│  │                                                               │  │
│  │  • getBiologicalRequests(req, res)                          │  │
│  │    - Verify patient ownership                                │  │
│  │    - Fetch all requests for patient                         │  │
│  │    - Format status for frontend                             │  │
│  │                                                               │  │
│  │  • createBiologicalRequest(req, res)                        │  │
│  │    - Validate input                                          │  │
│  │    - Check patient ownership                                 │  │
│  │    - Create request with empty results                      │  │
│  │    - Auto-generate request number (CUID)                    │  │
│  │                                                               │  │
│  │  • updateBiologicalRequest(req, res)                        │  │
│  │    - Verify request ownership                                │  │
│  │    - Update results, status, sampling date                  │  │
│  │    - Auto-manage status transitions                         │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │                                              │
└───────────────────────┼──────────────────────────────────────────────┘
                        │ Prisma ORM
                        │
┌───────────────────────▼─────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BiologicalRequest Table                                     │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  id              SERIAL PRIMARY KEY                          │  │
│  │  requestNumber   TEXT UNIQUE (CUID)                          │  │
│  │  patientId       INTEGER → Patient.id                        │  │
│  │  medecinId       INTEGER → Medecin.id                        │  │
│  │  sampleTypes     TEXT[] (Sang, Urine, Selles, Autre)        │  │
│  │  requestedExams  TEXT[] (Exam names)                         │  │
│  │  results         JSONB { "examName": "value" }               │  │
│  │  status          ENUM (EnCours, Completed)                   │  │
│  │  samplingDate    TIMESTAMP                                   │  │
│  │  createdAt       TIMESTAMP DEFAULT NOW()                     │  │
│  │  updatedAt       TIMESTAMP                                   │  │
│  └──────────────────┬──────────────┬────────────────────────────┘  │
│                     │              │                                │
│  ┌──────────────────▼──────┐  ┌───▼────────────────────────────┐  │
│  │  Patient Table          │  │  Medecin Table                 │  │
│  │  ─────────────────────  │  │  ────────────────────────────  │  │
│  │  id                     │  │  id                            │  │
│  │  fullName               │  │  fullName                      │  │
│  │  phoneNumber            │  │  email                         │  │
│  │  medecinId              │  │  phoneNumber                   │  │
│  │  ...                    │  │  ...                           │  │
│  └─────────────────────────┘  └────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Create New Biological Request

```
Frontend                    Backend                     Database
   │                           │                            │
   │  POST /biological-        │                            │
   │  requests                 │                            │
   ├──────────────────────────►│                            │
   │  {                        │  1. Verify JWT token       │
   │    patientId: 1,          │                            │
   │    sampleTypes: ["Sang"], │  2. Check patient         │
   │    requestedExams: [...]  │     ownership              │
   │  }                        ├───────────────────────────►│
   │                           │  3. Insert new request     │
   │                           │     with empty results     │
   │                           │◄───────────────────────────┤
   │                           │  4. Return created request │
   │◄──────────────────────────┤     with CUID              │
   │  {                        │                            │
   │    id: 1,                 │                            │
   │    requestNumber: "...",  │                            │
   │    status: "En cours"     │                            │
   │  }                        │                            │
   │                           │                            │
```

### 2. Update Results

```
Frontend                    Backend                     Database
   │                           │                            │
   │  PUT /biological-         │                            │
   │  requests/1               │                            │
   ├──────────────────────────►│                            │
   │  {                        │  1. Verify JWT token       │
   │    results: {             │                            │
   │      "Glycémie": "5.2"    │  2. Check request         │
   │    },                     │     ownership              │
   │    status: "Complété"     │                            │
   │  }                        ├───────────────────────────►│
   │                           │  3. Update results &       │
   │                           │     status                 │
   │                           │◄───────────────────────────┤
   │                           │  4. Return updated request │
   │◄──────────────────────────┤                            │
   │  {                        │                            │
   │    id: 1,                 │                            │
   │    results: {...},        │                            │
   │    status: "Complété"     │                            │
   │  }                        │                            │
   │                           │                            │
```

### 3. Retrieve Patient Requests

```
Frontend                    Backend                     Database
   │                           │                            │
   │  GET /biological-         │                            │
   │  requests/1               │                            │
   ├──────────────────────────►│                            │
   │                           │  1. Verify JWT token       │
   │                           │                            │
   │                           │  2. Check patient         │
   │                           │     ownership              │
   │                           │                            │
   │                           ├───────────────────────────►│
   │                           │  3. Fetch all requests     │
   │                           │     ORDER BY createdAt     │
   │                           │◄───────────────────────────┤
   │                           │  4. Map status values      │
   │◄──────────────────────────┤     & return array         │
   │  {                        │                            │
   │    requests: [            │                            │
   │      { id: 1, ... },      │                            │
   │      { id: 2, ... }       │                            │
   │    ]                      │                            │
   │  }                        │                            │
   │                           │                            │
```

## Security Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Request Security Chain                    │
└──────────────────────────────────────────────────────────────┘

1. JWT Authentication
   ├─ verifyAccessToken middleware
   ├─ Extract medecinId from token
   └─ Reject if invalid/expired (401)

2. Patient Ownership Verification
   ├─ Check Patient.medecinId === token.medecinId
   └─ Reject if not owner (403)

3. Request Ownership Verification (for updates)
   ├─ Check BiologicalRequest.medecinId === token.medecinId
   └─ Reject if not owner (404)

4. Input Validation
   ├─ Verify required fields present
   ├─ Validate data types
   └─ Reject if invalid (400)

5. Database Operation
   ├─ Execute with Prisma
   └─ Handle errors (500)

6. Response Formatting
   ├─ Map enum values to frontend labels
   ├─ Include all necessary fields
   └─ Return success (200/201)
```

## Status State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                  Request Status Lifecycle                    │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  NEW REQUEST │
                    │   (created)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
              ┌────►│  "En cours"  │◄────┐
              │     │   (EnCours)  │     │
              │     └──────┬───────┘     │
              │            │             │
   Clear      │            │ Add results │ Partial
   results    │            ▼             │ results
              │     ┌──────────────┐     │
              └─────│  "Complété"  │─────┘
                    │  (Completed) │
                    └──────────────┘
                           │
                           ▼
                    [All exams have
                     result values]
```

## Component Integration

```
┌────────────────────────────────────────────────────────────────┐
│              BiologicalDataSection Component                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State Management:                                              │
│  ├─ biologicalRequests[]     (from API)                        │
│  ├─ loading                  (UI state)                        │
│  ├─ showModal                (modal visibility)                │
│  ├─ formData                 (create form)                     │
│  ├─ resultsData              (edit form)                       │
│  └─ editingRequest           (current request)                 │
│                                                                 │
│  API Calls:                                                     │
│  ├─ loadBiologicalRequests() → GET /biological-requests/:id    │
│  ├─ handleCreateRequest()    → POST /biological-requests       │
│  └─ handleUpdateResults()    → PUT /biological-requests/:id    │
│                                                                 │
│  UI Features:                                                   │
│  ├─ Table view with status indicators                          │
│  ├─ Create modal (sample types + exams)                        │
│  ├─ Edit modal (results input)                                 │
│  ├─ Real-time comparison with normal ranges                    │
│  └─ Color-coded status badges                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Exam Types & Normal Ranges

```
┌─────────────────────────────────────────────────────────────────┐
│                     Available Examinations                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Glycémie à jeun      │  3.9 - 5.5 mmol/L    │ Blood glucose │
│  2. Cholestérol total    │  0 - 5.2 mmol/L      │ Total chol.   │
│  3. HDL Cholestérol      │  1.0+ mmol/L         │ Good chol.    │
│  4. LDL Cholestérol      │  0 - 3.4 mmol/L      │ Bad chol.     │
│  5. Triglycérides        │  0 - 1.7 mmol/L      │ Triglycerides │
│  6. Hémoglobine          │  12.0 - 16.0 g/dL    │ Hemoglobin    │
│  7. Créatinine           │  45 - 90 μmol/L      │ Creatinine    │
│  8. TSH                  │  0.4 - 4.0 mUI/L     │ Thyroid       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Result Interpretation:
├─ Normal:     Value within range
├─ Limite:     Within 10% of range boundaries
└─ Hors norme: Outside range (requires attention)
```

## Error Handling Matrix

```
┌──────────┬──────────────────────────────────────────────────────┐
│  Status  │  Scenario                                             │
├──────────┼──────────────────────────────────────────────────────┤
│   200    │  Success - Request retrieved/updated                 │
│   201    │  Success - Request created                           │
│   400    │  Bad Request - Missing/invalid fields                │
│   401    │  Unauthorized - Invalid/expired JWT                  │
│   403    │  Forbidden - Patient doesn't belong to medecin       │
│   404    │  Not Found - Request not found                       │
│   500    │  Internal Error - Database/server error              │
└──────────┴──────────────────────────────────────────────────────┘
```

---

**Architecture Date:** 2025-11-09
**Version:** 1.0.0
**Status:** Production Ready ✅
