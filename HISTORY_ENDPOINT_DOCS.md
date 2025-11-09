# History/Completed Appointments Endpoint Documentation

## Overview
Enhanced endpoint that provides comprehensive clinical history including vital signs, biological test results, and clinical notes for the medical history dashboard.

---

## Endpoint

### Get Completed Appointments with Clinical Data

**Method:** `GET`  
**URL:** `/medecin/completed-appointments`  
**Authentication:** Required (JWT Bearer Token)

#### Description
Retrieves all completed consultations for the authenticated medecin, enriched with vital signs, biological test data, clinical notes, and financial statistics.

#### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request
No request body required.

#### Response

**Success Response (200 OK):**
```json
{
  "completedApointments": [
    {
      "id": 1,
      "date": "2025-11-09",
      "startTime": "2025-11-09T09:00:00.000Z",
      "endTime": "2025-11-09T09:30:00.000Z",
      "patient": {
        "id": 123,
        "fullName": "Marie Dupont",
        "maladieChronique": "Hypertension artérielle"
      },
      "motif": "Consultation",
      "statut": "termine",
      "clinicalSummary": "Patient se plaint de maux de tête persistants. Tension légèrement élevée.",
      "vitalSigns": {
        "bloodPressureSystolic": 145,
        "bloodPressureDiastolic": 92,
        "heartRate": 82,
        "weight": 68,
        "height": 165,
        "bmi": 25.0
      },
      "biologicalTests": [
        {
          "test": "Glycémie à jeun",
          "status": "demandée",
          "date": "2025-11-09T09:00:00.000Z",
          "result": null
        },
        {
          "test": "Cholestérol total",
          "status": "reçue",
          "date": "2025-11-08T14:00:00.000Z",
          "result": "4.8 mmol/L"
        }
      ],
      "documents": []
    }
  ],
  "todayRevenue": 845,
  "weekRevenue": 3240,
  "averagePaid": 68
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired JWT token
- **403 Forbidden:** Access denied
- **404 Not Found:** No completed appointments found
- **500 Internal Server Error:** Server error

---

## Response Structure

### Main Response Object

| Field | Type | Description |
|-------|------|-------------|
| `completedApointments` | Array | List of completed consultation objects |
| `todayRevenue` | Float | Total revenue for today |
| `weekRevenue` | Float | Total revenue for this week |
| `averagePaid` | Integer | Average payment per consultation |

### Appointment Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique appointment ID |
| `date` | String (Date) | Consultation date (YYYY-MM-DD) |
| `startTime` | ISO 8601 DateTime | Consultation start time |
| `endTime` | ISO 8601 DateTime | Consultation end time |
| `patient` | Object | Patient information |
| `motif` | String | Consultation reason (default: "Consultation") |
| `statut` | String | Status (always "termine" for completed) |
| `clinicalSummary` | String (nullable) | Clinical notes from consultation |
| `vitalSigns` | Object (nullable) | Measured vital signs |
| `biologicalTests` | Array (nullable) | Related biological tests |
| `documents` | Array | Related documents (currently empty) |

### Patient Object (nested)

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Patient ID |
| `fullName` | String | Patient's full name |
| `maladieChronique` | String (nullable) | Chronic condition |

### Vital Signs Object (nullable)

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `bloodPressureSystolic` | Integer | Systolic BP (mmHg) | `paSystolique` field |
| `bloodPressureDiastolic` | Integer | Diastolic BP (mmHg) | `paDiastolique` field |
| `heartRate` | Integer | Heart rate (bpm) | `pulse` field |
| `weight` | Float | Weight (kg) | `poids` field |
| `height` | Integer | Height (cm) | Patient's `taille` field |
| `bmi` | Float | Body Mass Index | `imc` field |
| `pcm` | Float | PCM measurement | `pcm` field |

**Note:** Only fields with values are included in the response.

### Biological Test Object

| Field | Type | Description |
|-------|------|-------------|
| `test` | String | Name of the biological test |
| `status` | String | Test status: "demandée", "en attente", "reçue" |
| `date` | ISO 8601 DateTime | Date test was ordered/received |
| `result` | String (nullable) | Test result value (only for "reçue" status) |

#### Test Status Mapping

| Database Status | API Status | Meaning |
|----------------|------------|---------|
| `EnCours` | "en attente" | Test ordered, waiting for results |
| `Completed` | "reçue" | Results received |
| (new request) | "demandée" | Just prescribed |

---

## Data Sources

### Vital Signs
Vital signs are collected from the `RendezVous` table fields filled during consultation:
- `paSystolique` → bloodPressureSystolic
- `paDiastolique` → bloodPressureDiastolic
- `pulse` → heartRate
- `poids` → weight
- `imc` → bmi
- `pcm` → pcm

Height is taken from the Patient's `taille` field.

### Clinical Summary
- Comes from the `note` field in RendezVous table
- Set during consultation using `finishConsultation` endpoint
- Can be null if no notes were recorded

### Biological Tests
- Fetched from `BiologicalRequest` table
- Matched by patient ID
- Includes all tests for the patient (not limited to consultation date)
- Each test from `requestedExams` array becomes a separate test object
- Results extracted from `results` JSON field

---

## Query Strategy

### Performance Optimizations

1. **Parallel Queries:** Uses `Promise.all()` to fetch data concurrently
2. **Selective Fields:** Only fetches required fields with `select`
3. **Order Optimization:** Results ordered by date descending
4. **Patient Deduplication:** Unique patient IDs for biological request lookup

### Query Flow

```javascript
1. Fetch completed appointments with vital signs
2. Fetch revenue aggregates (today, week, average)
3. Extract unique patient IDs from appointments
4. Fetch biological requests for those patients
5. Map biological requests to individual tests
6. Enrich appointments with formatted data
7. Return complete response
```

---

## Usage in Frontend

### React Example (HistorySimple component)

```javascript
const loadHistoryData = async () => {
  try {
    let response = await fetch(`${baseURL}/medecin/completed-appointments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle errors (401, 403, 404, 500)
      if (response.status === 403) {
        logout();
        return;
      }
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        // Retry with refreshed token
        response = await fetch(/* ... */);
      }
    }

    const data = await response.json();
    setCompletedAppointments(data.completedApointments);
    setAveragePaid(data.averagePaid);
    setCaDay(data.todayRevenue);
    setCaWeek(data.weekRevenue);
  } catch (error) {
    console.error('Error loading history:', error);
  }
};
```

### Displaying Data

```javascript
// Render consultation
{appointment.vitalSigns && (
  <div>
    <p>Tension: {appointment.vitalSigns.bloodPressureSystolic}/
      {appointment.vitalSigns.bloodPressureDiastolic} mmHg</p>
    <p>Pouls: {appointment.vitalSigns.heartRate} bpm</p>
    <p>Poids: {appointment.vitalSigns.weight} kg</p>
  </div>
)}

// Render biological tests
{appointment.biologicalTests?.map(test => (
  <div key={test.test}>
    <h4>{test.test}</h4>
    <span>Status: {test.status}</span>
    {test.result && <span>Résultat: {test.result}</span>}
  </div>
))}

// Render clinical summary
{appointment.clinicalSummary && (
  <p>{appointment.clinicalSummary}</p>
)}
```

---

## Data Enrichment Details

### Vital Signs Collection
When a consultation is finished via `finishConsultation`, the following vital signs can be recorded:
- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Weight
- BMI
- PCM

### Biological Tests Integration
- Tests are linked via patient ID, not consultation ID
- All tests for a patient are returned
- Frontend should filter by date if needed
- Tests show latest status from BiologicalRequest

### Clinical Notes
- Stored in `note` field of RendezVous
- Free-text format
- Can include diagnosis, observations, treatment plan

---

## Key Features

### ✅ Complete Clinical History
- All completed consultations
- Full vital signs when available
- Clinical notes/observations
- Related biological tests
- Financial metrics

### ✅ Real-Time Data
- No caching - always current
- Includes latest biological test results
- Up-to-date revenue statistics

### ✅ Smart Data Mapping
- Converts database fields to frontend format
- Handles null values gracefully
- Only includes data that exists
- Maps biological request status correctly

### ✅ Flexible Structure
- Nullable fields for optional data
- Array for multiple biological tests
- Supports future document attachments

---

## Future Enhancements

### Recommended Additions

1. **Consultation Motif Field:** Add dedicated `motif` field to RendezVous model
2. **Temperature Field:** Add `temperature` to vital signs
3. **Oxygen Saturation:** Add `oxygenSaturation` field
4. **Respiratory Rate:** Add `respiratoryRate` field
5. **Document Management:** Implement document storage and linking
6. **Test History Filtering:** Filter biological tests by consultation date range
7. **Pagination:** Add pagination for large history datasets
8. **Date Range Filter:** Allow filtering by date range

---

## Testing

### Using cURL

```bash
curl -X GET http://localhost:4000/medecin/completed-appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using Postman

1. Create GET request to `http://localhost:4000/medecin/completed-appointments`
2. Add header: `Authorization: Bearer YOUR_JWT_TOKEN`
3. Send request
4. Verify response contains appointments with clinical data

### Expected Behavior

1. ✅ Returns array of completed appointments
2. ✅ Each appointment has patient information
3. ✅ Vital signs included when measured
4. ✅ Clinical summary included when notes exist
5. ✅ Biological tests included when prescribed
6. ✅ Revenue statistics calculated correctly
7. ✅ Ordered by date (newest first)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Request                          │
│              GET /medecin/completed-appointments            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend Controller                            │
│  1. Verify JWT token (medecinId extracted)                  │
│  2. Fetch completed appointments with vital signs           │
│  3. Calculate revenue statistics                            │
│  4. Extract patient IDs from appointments                   │
│  5. Fetch biological requests for patients                  │
│  6. Map biological tests with status                        │
│  7. Enrich appointments with formatted data                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Queries                          │
│  ├─ RendezVous (completed, with patient data)              │
│  ├─ Revenue aggregates (today, week, average)              │
│  └─ BiologicalRequest (for patients)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Formatting                        │
│  ├─ Map vital signs fields                                 │
│  ├─ Extract biological tests                               │
│  ├─ Include clinical notes                                 │
│  ├─ Add patient demographics                               │
│  └─ Calculate statistics                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    JSON Response                            │
│  {                                                          │
│    completedApointments: [...],                            │
│    todayRevenue: 845,                                      │
│    weekRevenue: 3240,                                      │
│    averagePaid: 68                                         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: No vital signs in response
**Cause:** Vital signs not recorded during consultation  
**Solution:** Use `finishConsultation` endpoint to record vital signs (paSystolique, paDiastolique, pulse, poids, imc)

### Issue: No biological tests shown
**Cause:** No biological requests created for patients  
**Solution:** Create biological requests using `/medecin/biological-requests` endpoint

### Issue: Clinical summary is null
**Cause:** No notes recorded during consultation  
**Solution:** Add notes when finishing consultation (note field in finishConsultation)

### Issue: 404 No appointments found
**Cause:** No completed consultations exist  
**Solution:** Complete some consultations first, or check if medecin has patients

### Issue: Slow response time
**Cause:** Large number of appointments or biological requests  
**Solution:** Consider adding pagination or date range filtering

---

## Security Features

✅ **JWT Authentication:** All requests require valid token  
✅ **Medecin Isolation:** Only returns data for authenticated medecin  
✅ **Patient Privacy:** Only includes necessary patient information  
✅ **Token Refresh:** Supports automatic token refresh on 401  

---

## Integration Checklist

- [x] Endpoint implemented in controller
- [x] Route exists and protected with auth
- [x] JWT authentication middleware applied
- [x] Vital signs fields included
- [x] Clinical notes included
- [x] Biological tests integration
- [x] Revenue statistics calculated
- [x] Frontend integration in HistorySimple component
- [x] Error handling for auth failures
- [x] Token refresh support
- [x] Graceful handling of null values

---

**Created:** 2025-11-09  
**Endpoint:** `GET /medecin/completed-appointments`  
**Related Component:** `HistorySimple.jsx`  
**Status:** ✅ Production Ready
