# Biological Requests Implementation

## Overview
This document describes the backend implementation for the Biological Data Section component that manages biological test requests for patients.

## Database Schema Changes

### New Model: BiologicalRequest

Added a new Prisma model to handle biological test requests with the following fields:

```prisma
model BiologicalRequest {
  id              Int                      @id @default(autoincrement())
  requestNumber   String                   @unique @default(cuid())
  patientId       Int
  medecinId       Int
  sampleTypes     String[]                 // Array: ['Sang', 'Urine', 'Selles', 'Autre']
  requestedExams  String[]                 // Array: ['Glycémie à jeun', 'Cholestérol total', etc.]
  results         Json?                    // JSON: { "examName": "value" }
  status          BiologicalRequestStatus  @default(EnCours)
  samplingDate    DateTime?
  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt

  patient Patient @relation(fields: [patientId], references: [id])
  medecin Medecin @relation(fields: [medecinId], references: [id])
}
```

### New Enum: BiologicalRequestStatus

```prisma
enum BiologicalRequestStatus {
  EnCours    // Maps to "En cours" in frontend
  Completed  // Maps to "Complété" in frontend
}
```

### Updated Models

- **Patient**: Added `biologicalRequests BiologicalRequest[]` relation
- **Medecin**: Added `biologicalRequests BiologicalRequest[]` relation

## API Endpoints

All endpoints are protected with `verifyAccessToken` middleware and require authentication.

### 1. Get Biological Requests for a Patient

**Endpoint:** `GET /medecin/biological-requests/:patientId`

**Description:** Retrieves all biological requests for a specific patient.

**Request:**
- Headers: `Authorization: Bearer <token>`
- Params: `patientId` (integer)

**Response:**
```json
{
  "requests": [
    {
      "id": 1,
      "requestNumber": "cuid-generated-string",
      "patientId": 123,
      "medecinId": 456,
      "sampleTypes": ["Sang", "Urine"],
      "requestedExams": ["Glycémie à jeun", "Cholestérol total"],
      "results": {
        "Glycémie à jeun": "5.2",
        "Cholestérol total": "4.8"
      },
      "status": "En cours",
      "samplingDate": "2025-11-09T00:00:00.000Z",
      "createdAt": "2025-11-09T10:00:00.000Z",
      "updatedAt": "2025-11-09T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- 400: Patient ID is required
- 403: Access denied (patient doesn't belong to this medecin)
- 500: Server error

---

### 2. Create Biological Request

**Endpoint:** `POST /medecin/biological-requests`

**Description:** Creates a new biological request for a patient (without results initially).

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```json
{
  "patientId": 123,
  "sampleTypes": ["Sang", "Urine"],
  "requestedExams": ["Glycémie à jeun", "Cholestérol total", "HDL Cholestérol"],
  "status": "En cours"
}
```

**Response:**
```json
{
  "request": {
    "id": 1,
    "requestNumber": "cuid-generated-string",
    "patientId": 123,
    "medecinId": 456,
    "sampleTypes": ["Sang", "Urine"],
    "requestedExams": ["Glycémie à jeun", "Cholestérol total", "HDL Cholestérol"],
    "results": {},
    "status": "En cours",
    "samplingDate": null,
    "createdAt": "2025-11-09T10:00:00.000Z",
    "updatedAt": "2025-11-09T10:00:00.000Z"
  },
  "message": "Biological request created successfully"
}
```

**Error Responses:**
- 400: Missing required fields (patientId, sampleTypes, requestedExams)
- 403: Access denied (patient doesn't belong to this medecin)
- 500: Server error

---

### 3. Update Biological Request Results

**Endpoint:** `PUT /medecin/biological-requests/:requestId`

**Description:** Updates the results, status, and sampling date of an existing biological request.

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Params: `requestId` (integer)
- Body:
```json
{
  "patientId": 123,
  "results": {
    "Glycémie à jeun": "5.2",
    "Cholestérol total": "4.8",
    "HDL Cholestérol": "1.2"
  },
  "status": "Complété",
  "samplingDate": "2025-11-09"
}
```

**Response:**
```json
{
  "request": {
    "id": 1,
    "requestNumber": "cuid-generated-string",
    "patientId": 123,
    "medecinId": 456,
    "sampleTypes": ["Sang", "Urine"],
    "requestedExams": ["Glycémie à jeun", "Cholestérol total", "HDL Cholestérol"],
    "results": {
      "Glycémie à jeun": "5.2",
      "Cholestérol total": "4.8",
      "HDL Cholestérol": "1.2"
    },
    "status": "Complété",
    "samplingDate": "2025-11-09T00:00:00.000Z",
    "createdAt": "2025-11-09T10:00:00.000Z",
    "updatedAt": "2025-11-09T12:00:00.000Z"
  },
  "message": "Biological request updated successfully"
}
```

**Error Responses:**
- 400: Request ID is required
- 403: Access denied (patient doesn't belong to this medecin)
- 404: Biological request not found
- 500: Server error

---

## Implementation Details

### Controller Functions

Located in: `/src/controllers/medecinController.js`

1. **getBiologicalRequests**: Fetches all requests for a patient with medecin ownership verification
2. **createBiologicalRequest**: Creates new request with validation and ownership checks
3. **updateBiologicalRequest**: Updates request results with partial update support

### Routes

Located in: `/src/routes/medecin.js`

All routes are prefixed with `/medecin` and protected by `verifyAccessToken` middleware:

```javascript
router.get('/biological-requests/:patientId', verifyAccessToken, getBiologicalRequests);
router.post('/biological-requests', verifyAccessToken, createBiologicalRequest);
router.put('/biological-requests/:requestId', verifyAccessToken, updateBiologicalRequest);
```

### Security Features

1. **Authentication**: All endpoints require valid JWT access token
2. **Authorization**: Medecin can only access/modify requests for their own patients
3. **Validation**: Input validation on all required fields
4. **Ownership Checks**: Verifies patient belongs to requesting medecin

### Data Flow

#### Creating a Request
1. Frontend submits sample types and requested exams
2. Backend validates ownership and creates request with empty results
3. Status defaults to "En cours"
4. Returns created request with auto-generated requestNumber

#### Updating Results
1. Frontend submits results for each exam
2. Backend validates request ownership
3. Updates results, status, and sampling date
4. Status automatically changes to "Complété" when all exams have results
5. Returns updated request

#### Retrieving Requests
1. Frontend requests all biological data for a patient
2. Backend verifies patient ownership
3. Returns all requests ordered by creation date (newest first)
4. Frontend displays in table format with status indicators

### Status Mapping

The database uses enum values, but the API maps them to French labels:

- Database: `EnCours` ↔ Frontend: `"En cours"`
- Database: `Completed` ↔ Frontend: `"Complété"`

This mapping is handled automatically in the controller functions.

## Migration

The migration file is located at:
`/prisma/migrations/20251109161722_add_biological_requests/migration.sql`

To apply the migration (when DATABASE_URL is configured):
```bash
npx prisma migrate deploy
```

Or in development:
```bash
npx prisma migrate dev
```

## Frontend Integration

The frontend component expects the following from the backend:

1. **Request Creation**: POST endpoint that accepts sampleTypes and requestedExams arrays
2. **Results Update**: PUT endpoint that accepts results object and auto-updates status
3. **Data Retrieval**: GET endpoint that returns all requests with formatted status

All these requirements are met by the implemented endpoints.

## Available Exam Types (Frontend Reference)

The frontend defines these exam types with normal ranges:

1. **Glycémie à jeun**: 3.9-5.5 mmol/L
2. **Cholestérol total**: 0-5.2 mmol/L
3. **HDL Cholestérol**: 1.0+ mmol/L
4. **LDL Cholestérol**: 0-3.4 mmol/L
5. **Triglycérides**: 0-1.7 mmol/L
6. **Hémoglobine**: 12.0-16.0 g/dL
7. **Créatinine**: 45-90 μmol/L
8. **TSH**: 0.4-4.0 mUI/L

## Sample Types (Frontend Reference)

Available sample types:
- Sang
- Urine
- Selles
- Autre

## Testing the Endpoints

### Example: Create a Request

```bash
curl -X POST http://localhost:4000/medecin/biological-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "sampleTypes": ["Sang"],
    "requestedExams": ["Glycémie à jeun", "Cholestérol total"],
    "status": "En cours"
  }'
```

### Example: Update Results

```bash
curl -X PUT http://localhost:4000/medecin/biological-requests/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "results": {
      "Glycémie à jeun": "5.2",
      "Cholestérol total": "4.8"
    },
    "status": "Complété",
    "samplingDate": "2025-11-09"
  }'
```

### Example: Get Patient Requests

```bash
curl -X GET http://localhost:4000/medecin/biological-requests/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- The `requestNumber` is auto-generated using Prisma's `cuid()` function
- The `results` field is stored as JSONB in PostgreSQL for flexible querying
- Arrays are used for `sampleTypes` and `requestedExams` to support multiple selections
- The frontend handles all result comparisons with normal ranges client-side
- The backend focuses on data storage and retrieval with proper access control
