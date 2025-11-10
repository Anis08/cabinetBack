# History Endpoint Documentation

## Endpoint Overview

**Route:** `GET /medecin/history`  
**Authentication:** Required (JWT Access Token)  
**Purpose:** Retrieve all completed appointments with enriched data for the infinite scroll history component

---

## Request

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
None required - the endpoint returns ALL completed appointments for client-side filtering and pagination.

---

## Response Format

### Success Response (200 OK)

```json
{
  "appointments": [
    {
      "id": 123,
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "2024-01-15T09:00:00.000Z",
      "endTime": "2024-01-15T09:30:00.000Z",
      "state": "Completed",
      "patientId": 456,
      "patient": {
        "id": 456,
        "fullName": "John Doe",
        "maladieChronique": "Diabète Type 2"
      },
      "motif": "Consultation",
      "note": "Patient doing well, continue current treatment",
      "vitalSigns": {
        "bloodPressureSystolic": 120,
        "bloodPressureDiastolic": 80,
        "heartRate": 72,
        "weight": 75.5,
        "height": 175,
        "bmi": 24.6,
        "pcm": 95
      },
      "biologicalTests": [
        {
          "test": "Glycémie",
          "status": "reçue",
          "date": "2024-01-15T08:00:00.000Z",
          "result": "95 mg/dL"
        }
      ],
      "documents": []
    }
  ]
}
```

### Response Fields

#### Root Object
- `appointments` (array): Flat array of all completed appointments

#### Appointment Object
- `id` (number): Unique appointment identifier
- `date` (ISO string): Appointment date
- `startTime` (ISO string): Appointment start time
- `endTime` (ISO string): Appointment end time
- `state` (string): Always "Completed" for this endpoint
- `patientId` (number): Patient identifier
- `patient` (object): Patient information
  - `id` (number): Patient identifier
  - `fullName` (string): Patient's full name
  - `maladieChronique` (string|null): Chronic conditions
- `motif` (string): Consultation reason (always "Consultation")
- `note` (string|null): Doctor's notes from consultation
- `vitalSigns` (object|null): Vital signs recorded during consultation
  - `bloodPressureSystolic` (number): Systolic blood pressure (mmHg)
  - `bloodPressureDiastolic` (number): Diastolic blood pressure (mmHg)
  - `heartRate` (number): Heart rate (bpm)
  - `weight` (number): Weight (kg)
  - `height` (number): Height (cm)
  - `bmi` (number): Body Mass Index
  - `pcm` (number): Arm circumference
- `biologicalTests` (array|null): Biological test results
  - `test` (string): Test name (e.g., "Glycémie", "Hémoglobine")
  - `status` (string): Test status ("reçue", "en attente", "demandée")
  - `date` (ISO string): Test request/completion date
  - `result` (string|null): Test result if available
- `documents` (array): Currently empty, reserved for future use

### Error Responses

#### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Failed to fetch history",
  "error": "Error details"
}
```

---

## Data Characteristics

### Sorting
- Appointments are sorted by **date descending** (newest first)
- This allows the frontend to display recent appointments at the top

### Filtering
- Server returns ALL completed appointments
- Filtering (search, date range) is handled **client-side** for performance
- This enables instant filtering without additional API calls

### Pagination
- Server returns all data
- Pagination (10 items per page) is handled **client-side**
- Uses infinite scroll with IntersectionObserver API

### Data Enrichment
- **Vital Signs**: Mapped from database fields (paSystolique → bloodPressureSystolic)
- **Biological Tests**: Fetched from BiologicalRequest model and formatted
- **Status Mapping**: Database status → User-friendly French status
  - `Completed` → "reçue"
  - `EnCours` → "en attente"
  - Other → "demandée"

---

## Usage Example

### JavaScript/React
```javascript
const fetchHistory = async () => {
  try {
    const response = await fetch('http://localhost:3000/medecin/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    const data = await response.json();
    console.log(`Fetched ${data.appointments.length} appointments`);
    
    // Client-side filtering example
    const filteredAppointments = data.appointments.filter(apt => 
      apt.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredAppointments;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};
```

---

## Frontend Component Integration

### HistorySimple Component Features
1. **Infinite Scroll**: Loads 10 appointments at a time
2. **Search**: Filters by patient name (client-side)
3. **Date Range**: Filters by date range (client-side)
4. **Grouping**: Groups by date (client-side)
6. **Weekly Insights**: Calculates stats from visible appointments

### Performance Considerations
- Initial load fetches all data once
- All subsequent operations (search, filter, pagination) are instant
- No additional API calls needed for filtering
- Suitable for practices with up to ~10,000 completed appointments
- For larger datasets, consider server-side pagination

---

## Database Queries

### Appointments Query
```javascript
prisma.rendezVous.findMany({
  where: {
    medecinId: medecinId,
    state: 'Completed'
  },
  select: {
    id, startTime, endTime, date, state, patientId, paid, note,
    poids, pcm, imc, pulse, paSystolique, paDiastolique,
    patient: {
      select: { id, fullName, maladieChronique, poids, taille }
    }
  },
  orderBy: { date: 'desc' }
})
```

### Biological Requests Query
```javascript
prisma.biologicalRequest.findMany({
  where: {
    medecinId,
    patientId: { in: patientIds }
  },
  select: {
    id, patientId, requestedExams, results, 
    status, samplingDate, createdAt
  },
  orderBy: { createdAt: 'desc' }
})
```

---

## Differences from Other Endpoints

### vs `/medecin/completed-appointments`
- **Completed**: Returns flat array, basic format

### vs `/medecin/completed-appointments-grouped`
- **History**: Returns flat array for client-side grouping
- **Grouped**: Returns pre-grouped object with revenue metrics

### Design Rationale
- Separate endpoint for different UI component needs
- Allows independent evolution of features
- Cleaner separation of concerns

---

## Testing

### Manual Testing with curl
```bash
# Test with valid token
curl -X GET http://localhost:3000/medecin/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Test without token (should return 401)
curl -X GET http://localhost:3000/medecin/history

# Test with invalid token (should return 401)
curl -X GET http://localhost:3000/medecin/history \
  -H "Authorization: Bearer invalid_token"
```

### Expected Results
1. **Valid Token**: Returns 200 with appointments array
2. **No Token**: Returns 401 Unauthorized
3. **Invalid Token**: Returns 401 Unauthorized
4. **No Completed Appointments**: Returns 200 with empty array

---

## Troubleshooting

### Issue: Empty appointments array
**Cause**: No completed appointments in database  
**Solution**: Ensure appointments have `state: 'Completed'`

### Issue: Missing vital signs
**Cause**: Vital signs not recorded during consultation  
**Solution**: vitalSigns will be `null` if no data available (expected behavior)

### Issue: Missing biological tests
**Cause**: No biological requests for patients  
**Solution**: biologicalTests will be `null` if no data available (expected behavior)

### Issue: 401 Unauthorized
**Cause**: Missing or invalid JWT token  
**Solution**: Ensure valid access token in Authorization header

### Issue: Slow response
**Cause**: Large number of completed appointments  
**Solution**: Consider implementing server-side pagination for 10,000+ appointments

---

## Future Enhancements

1. **Server-side Pagination**: Add `?page=1&limit=50` query parameters
2. **Server-side Filtering**: Add `?search=term&startDate=X&endDate=Y` query parameters
3. **Documents Support**: Populate `documents` array with uploaded files
4. **Partial Updates**: Add WebSocket support for real-time updates
5. **Export Feature**: Add CSV/PDF export endpoint for history data

---

## Related Files

- **Controller**: `src/controllers/medecinController.js` (getHistory function)
- **Routes**: `src/routes/medecin.js` (route definition)
- **Middleware**: `src/middleware/verifyAccessToken.js` (JWT verification)
- **Frontend**: `HistorySimple.jsx` (component using this endpoint)

---

## Changelog

### Version 1.0 (2024-01-15)
- Initial implementation
- Returns all completed appointments
- Includes vital signs and biological tests
- Ordered by date descending
