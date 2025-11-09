# Calendar Appointments Endpoint Documentation

## Overview
This endpoint provides all appointments for the calendar view in the CalendarSimple component.

---

## Endpoint

### Get All Appointments

**Method:** `GET`  
**URL:** `/medecin/appointments`  
**Authentication:** Required (JWT Bearer Token)

#### Description
Retrieves all appointments for the authenticated medecin, including patient details, ordered chronologically for calendar display.

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
  "appointments": [
    {
      "id": 1,
      "date": "2025-11-15T00:00:00.000Z",
      "patientId": 123,
      "medecinId": 456,
      "state": "Scheduled",
      "arrivalTime": null,
      "startTime": null,
      "endTime": null,
      "createdAt": "2025-11-09T10:00:00.000Z",
      "patient": {
        "id": 123,
        "fullName": "Jean Dupont",
        "phoneNumber": "+33612345678"
      }
    },
    {
      "id": 2,
      "date": "2025-11-15T00:00:00.000Z",
      "patientId": 124,
      "medecinId": 456,
      "state": "Completed",
      "arrivalTime": "2025-11-09T09:00:00.000Z",
      "startTime": "2025-11-09T09:15:00.000Z",
      "endTime": "2025-11-09T09:45:00.000Z",
      "createdAt": "2025-11-08T14:00:00.000Z",
      "patient": {
        "id": 124,
        "fullName": "Marie Martin",
        "phoneNumber": "+33623456789"
      }
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired JWT token
  ```json
  {
    "message": "Unauthorized"
  }
  ```

- **403 Forbidden:** Access denied
  ```json
  {
    "message": "Access denied"
  }
  ```

- **500 Internal Server Error:** Server error
  ```json
  {
    "message": "Failed to retrieve appointments",
    "error": "Error details"
  }
  ```

---

## Response Fields

### Appointment Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique appointment ID |
| `date` | ISO 8601 DateTime | Appointment date (time set to 00:00:00) |
| `patientId` | Integer | ID of the patient |
| `medecinId` | Integer | ID of the medecin |
| `state` | Enum | Appointment status: `Scheduled`, `Waiting`, `InProgress`, `Completed`, `Cancelled` |
| `arrivalTime` | ISO 8601 DateTime (nullable) | When patient arrived |
| `startTime` | ISO 8601 DateTime (nullable) | When consultation started |
| `endTime` | ISO 8601 DateTime (nullable) | When consultation ended |
| `createdAt` | ISO 8601 DateTime | When appointment was created |
| `patient` | Object | Patient details (nested) |

### Patient Object (Nested)

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Patient ID |
| `fullName` | String | Patient's full name |
| `phoneNumber` | String | Patient's phone number |

---

## Appointment States

| State | Description | When Used |
|-------|-------------|-----------|
| `Scheduled` | Default state | Appointment is booked but patient hasn't arrived |
| `Waiting` | Patient arrived | Patient in waiting room |
| `InProgress` | Consultation active | Patient is currently being consulted |
| `Completed` | Consultation finished | Consultation completed successfully |
| `Cancelled` | Appointment cancelled | Appointment was cancelled (automatically for past unattended appointments) |

---

## Usage in Frontend

### React Example (CalendarSimple component)

```javascript
const loadAppointments = async () => {
  try {
    let response = await fetch(`${baseURL}/medecin/appointments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle errors (401, 403, 500)
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
        // Retry request with new token
        response = await fetch(`${baseURL}/medecin/appointments`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        });
      }
    }

    if (response.ok) {
      const data = await response.json();
      setAppointments(data.appointments || []);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error);
  }
};
```

### Processing Appointments by Date

```javascript
// Get appointments for a specific date
const getAppointmentsForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return appointments
    .filter(apt => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      return aptDate === dateStr;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// Check if date has appointments
const hasAppointments = (date) => {
  return getAppointmentsForDate(date).length > 0;
};

// Get appointment status (past, today, future)
const getAppointmentStatus = (appointmentDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(0, 0, 0, 0);
  
  if (apptDate < today) return 'past';
  if (apptDate.getTime() === today.getTime()) return 'today';
  return 'future';
};
```

---

## Calendar Statistics

Use the appointments array to calculate statistics:

```javascript
const today = new Date().toISOString().split('T')[0];

const stats = {
  total: appointments.length,
  
  aujourdhui: appointments.filter(apt => {
    const aptDate = new Date(apt.date).toISOString().split('T')[0];
    return aptDate === today;
  }).length,
  
  semaine: appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const weekStart = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(weekStart.getDate() + 7);
    return aptDate >= weekStart && aptDate <= weekEnd;
  }).length,
  
  aVenir: appointments.filter(apt => 
    getAppointmentStatus(apt.date) === 'future'
  ).length
};
```

---

## Security Features

✅ **JWT Authentication:** All requests must include valid JWT token  
✅ **Medecin Ownership:** Only returns appointments for the authenticated medecin  
✅ **Patient Privacy:** Only includes necessary patient information  
✅ **Token Refresh:** Supports automatic token refresh on 401 errors

---

## Performance Considerations

- **Ordering:** Results are pre-sorted by date (ascending) for efficient calendar rendering
- **Patient Data:** Includes minimal patient information to reduce payload size
- **Caching:** Consider caching appointments in frontend state to reduce API calls
- **Filtering:** All date filtering should be done client-side after initial load

---

## Testing

### Using cURL

```bash
curl -X GET http://localhost:4000/medecin/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using Postman

1. Create GET request to `http://localhost:4000/medecin/appointments`
2. Add header: `Authorization: Bearer YOUR_JWT_TOKEN`
3. Send request
4. Verify response contains appointments array

### Expected Behavior

1. ✅ Returns all appointments for authenticated medecin
2. ✅ Includes patient details (id, fullName, phoneNumber)
3. ✅ Ordered by date ascending (earliest first)
4. ✅ Includes all appointment states
5. ✅ Returns empty array if no appointments exist
6. ✅ Handles authentication errors properly

---

## Related Endpoints

- `POST /medecin/add-appointment` - Create new appointment
- `GET /medecin/today-appointments` - Get today's appointments only
- `GET /medecin/completed-appointments` - Get completed appointments with statistics
- `POST /medecin/add-to-waiting` - Move appointment to waiting state
- `POST /medecin/add-to-actif` - Start consultation (InProgress state)
- `POST /medecin/finish-consultation` - Complete consultation

---

## Integration Checklist

- [x] Endpoint implemented in controller
- [x] Route added to router
- [x] JWT authentication middleware applied
- [x] Returns patient details for display
- [x] Ordered by date for calendar view
- [x] Frontend integration in CalendarSimple component
- [x] Error handling for auth failures
- [x] Token refresh support

---

## Troubleshooting

### Issue: "Failed to retrieve appointments"
**Cause:** Database or server error  
**Solution:** Check server logs, verify database connection

### Issue: Empty appointments array
**Cause:** No appointments created yet or wrong medecin ID  
**Solution:** Create test appointments, verify JWT token contains correct medecinId

### Issue: 401 Unauthorized
**Cause:** Invalid or expired JWT token  
**Solution:** Refresh token or re-authenticate

### Issue: Patient data missing
**Cause:** Patient deleted or data inconsistency  
**Solution:** Check database integrity, ensure foreign keys are valid

---

**Created:** 2025-11-09  
**Endpoint:** `GET /medecin/appointments`  
**Related Component:** `CalendarSimple.jsx`  
**Status:** ✅ Production Ready
