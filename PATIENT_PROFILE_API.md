# Patient Profile API Documentation

## ✅ **STATUS: FULLY FUNCTIONAL**

The Patient Profile page is **already functional** with existing backend endpoints. This document provides complete API reference and usage guide.

---

## 🎯 **Available Endpoints**

### 1. Get Patient Profile

**Endpoint:** `GET /medecin/profile-patient/:id`  
**Authentication:** Required (JWT)  
**Purpose:** Get complete patient profile with consultation history and next appointment

#### Request
```bash
curl -X GET http://localhost:4000/medecin/profile-patient/123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response (200 OK)
```json
{
  "patient": {
    "id": 123,
    "fullName": "Marie DUBOIS",
    "phoneNumber": "+33612345678",
    "gender": "Femme",
    "poids": 72.5,
    "taille": 165,
    "dateOfBirth": "1970-05-15T00:00:00.000Z",
    "bio": "Patient information...",
    "maladieChronique": "Hypertension artérielle",
    "createdAt": "2023-01-15T10:00:00.000Z",
    "rendezVous": [
      {
        "id": 1,
        "date": "2024-11-01T00:00:00.000Z",
        "startTime": "2024-11-01T09:00:00.000Z",
        "endTime": "2024-11-01T09:30:00.000Z",
        "state": "Completed",
        "paSystolique": 145,
        "paDiastolique": 92,
        "pulse": 78,
        "poids": 72.5,
        "imc": 26.6,
        "pcm": 95,
        "note": "Patient doing well, continue treatment"
      }
    ]
  },
  "nextAppointment": {
    "id": 2,
    "date": "2024-12-15T00:00:00.000Z",
    "state": "Scheduled"
  }
}
```

#### Response Fields

**Patient Object:**
- `id` (number): Patient identifier
- `fullName` (string): Full name
- `phoneNumber` (string): Phone number
- `gender` (string): "Homme" or "Femme"
- `poids` (number): Weight in kg
- `taille` (number): Height in cm
- `dateOfBirth` (ISO string): Date of birth
- `bio` (string): Patient bio/notes
- `maladieChronique` (string): Chronic condition
- `createdAt` (ISO string): Registration date
- `rendezVous` (array): Array of completed consultations (ordered by date desc)

**RendezVous Object (Consultation):**
- `id` (number): Appointment ID
- `date` (ISO string): Appointment date
- `startTime` (ISO string): Start time
- `endTime` (ISO string): End time
- `state` (string): "Completed"
- `paSystolique` (number): Systolic blood pressure (mmHg)
- `paDiastolique` (number): Diastolic blood pressure (mmHg)
- `pulse` (number): Heart rate (bpm)
- `poids` (number): Weight (kg)
- `imc` (number): BMI
- `pcm` (number): Mid-upper arm circumference
- `note` (string): Doctor's notes

**NextAppointment Object:**
- `id` (number): Appointment ID
- `date` (ISO string): Scheduled date
- `state` (string): "Scheduled", "Waiting", or "InProgress"

---

### 2. Get Biological Requests

**Endpoint:** `GET /medecin/biological-requests/:patientId`  
**Authentication:** Required (JWT)  
**Purpose:** Get all biological test requests for a patient

#### Request
```bash
curl -X GET http://localhost:4000/medecin/biological-requests/123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Response (200 OK)
```json
{
  "requests": [
    {
      "id": 1,
      "requestNumber": "BIO-2024-001",
      "patientId": 123,
      "medecinId": 1,
      "sampleTypes": ["Sang"],
      "requestedExams": ["Glycémie", "Cholestérol total", "HDL", "LDL"],
      "results": {
        "Glycémie": "5.8 mmol/L",
        "Cholestérol total": "6.2 mmol/L",
        "HDL": "1.4 mmol/L",
        "LDL": "4.1 mmol/L"
      },
      "status": "Completed",
      "samplingDate": "2024-11-01T08:00:00.000Z",
      "createdAt": "2024-11-01T10:00:00.000Z",
      "updatedAt": "2024-11-05T14:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3. Create Biological Request

**Endpoint:** `POST /medecin/biological-requests`  
**Authentication:** Required (JWT)

#### Request Body
```json
{
  "patientId": 123,
  "sampleTypes": ["Sang", "Urine"],
  "requestedExams": ["Glycémie", "Cholestérol total", "Créatinine"],
  "samplingDate": "2024-12-01"
}
```

#### Response (201 Created)
```json
{
  "message": "Biological request created successfully",
  "request": {
    "id": 2,
    "requestNumber": "BIO-2024-002",
    "patientId": 123,
    "medecinId": 1,
    "sampleTypes": ["Sang", "Urine"],
    "requestedExams": ["Glycémie", "Cholestérol total", "Créatinine"],
    "results": null,
    "status": "EnCours",
    "samplingDate": "2024-12-01T00:00:00.000Z",
    "createdAt": "2024-11-10T10:00:00.000Z"
  }
}
```

---

### 4. Update Biological Request

**Endpoint:** `PUT /medecin/biological-requests/:requestId`  
**Authentication:** Required (JWT)

#### Request Body
```json
{
  "results": {
    "Glycémie": "5.5 mmol/L",
    "Cholestérol total": "5.8 mmol/L"
  },
  "status": "Completed"
}
```

---

## 📊 **Data Flow**

### Patient Profile Page Flow

```
1. User navigates to /patient/:patientId
   ↓
2. Component calls GET /medecin/profile-patient/:id
   ↓
3. Backend fetches:
   - Patient basic info
   - All completed consultations (with vital signs)
   - Next scheduled appointment
   ↓
4. Component displays:
   - Patient header with basic info
   - Vital signs from latest consultation
   - Charts showing trends (weight, heart rate, blood pressure)
   - History modal with all past consultations
   ↓
5. BiologicalDataSection component calls GET /medecin/biological-requests/:patientId
   ↓
6. Backend fetches all biological test requests
   ↓
7. Component displays biological data section
```

---

## 🎨 **Frontend Integration**

### Your React Component Structure

```javascript
const PatientProfile = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);

  useEffect(() => {
    const getPatient = async () => {
      const response = await fetch(
        `${baseURL}/medecin/profile-patient/${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      setPatient(data.patient);
      setNextAppointment(data.nextAppointment);
    };
    
    getPatient();
  }, [patientId]);

  // Rest of component...
};
```

---

## 📈 **Chart Data Processing**

### Weight History
```javascript
// Your component expects rendezVous array
const weightHistory = patient?.rendezVous 
  ? [...patient.rendezVous].reverse() 
  : [];

// Charts use: dataKey="poids"
<AreaChart data={weightHistory}>
  <Area dataKey="poids" />
</AreaChart>
```

### Heart Rate History
```javascript
// Charts use: dataKey="pulse"
<LineChart data={weightHistory}>
  <Line dataKey="pulse" />
</LineChart>
```

### Blood Pressure History
```javascript
// Charts use: dataKey="paSystolique" and "paDiastolique"
<LineChart data={weightHistory}>
  <Line dataKey="paSystolique" name="Systolique" />
  <Line dataKey="paDiastolique" name="Diastolique" />
</LineChart>
```

---

## ✅ **Current Implementation Status**

| Feature | Backend Status | Frontend Status |
|---------|---------------|-----------------|
| Get patient profile | ✅ Working | ✅ Implemented |
| Display basic info | ✅ Working | ✅ Implemented |
| Show vital signs | ✅ Working | ✅ Implemented |
| Weight chart | ✅ Working | ✅ Implemented |
| Heart rate chart | ✅ Working | ✅ Implemented |
| Blood pressure chart | ✅ Working | ✅ Implemented |
| History modal | ✅ Working | ✅ Implemented |
| Biological requests | ✅ Working | ✅ Implemented |
| Next appointment | ✅ Working | ✅ Implemented |

---

## 🔍 **Helper Functions**

### Calculate Age from Date of Birth

Your component already has this:

```javascript
function getAgeFromDate(dateString) {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
```

### Format Date for Charts

```javascript
tickFormatter={(date) => {
  const d = new Date(date);
  const parts = d.toLocaleDateString('fr-FR').split('/');
  parts[2] = parts[2].slice(-2); // Keep last 2 digits of year
  return parts.join('/');
}}
```

---

## 🧪 **Testing the Endpoints**

### Test 1: Get Patient Profile
```bash
# Replace 123 with actual patient ID
curl -X GET http://localhost:4000/medecin/profile-patient/123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Patient object with rendezVous array
```

### Test 2: Get Biological Requests
```bash
curl -X GET http://localhost:4000/medecin/biological-requests/123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Array of biological requests
```

### Test 3: Create Biological Request
```bash
curl -X POST http://localhost:4000/medecin/biological-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 123,
    "sampleTypes": ["Sang"],
    "requestedExams": ["Glycémie", "Cholestérol"],
    "samplingDate": "2024-12-01"
  }'
```

---

## ⚠️ **Common Issues & Solutions**

### Issue: "Aucun patient trouvé" (404)
**Cause:** Patient ID doesn't exist or doesn't belong to this doctor  
**Solution:** Verify patient ID is correct and belongs to authenticated medecin

### Issue: Empty rendezVous array
**Cause:** Patient has no completed consultations  
**Solution:** This is normal for new patients. Charts will show empty state.

### Issue: Vital signs showing "-"
**Cause:** No vital signs recorded in latest consultation  
**Solution:** This is expected if consultation didn't record vital signs.

### Issue: Charts not rendering
**Cause:** No data or incorrect data format  
**Solution:** Check console for errors. Ensure `patient?.rendezVous` exists.

### Issue: 401 Unauthorized
**Cause:** JWT token expired or invalid  
**Solution:** Component handles this with `refresh()` call. Ensure auth is working.

---

## 📱 **Mobile Responsiveness**

Your component already handles responsive layouts:

```javascript
// Grid adjusts based on screen size
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"

// Modal is responsive
className="max-w-6xl w-full max-h-[90vh] overflow-hidden"

// Charts are responsive with ResponsiveContainer
<ResponsiveContainer width="100%" height={250}>
```

---

## 🎨 **UI Components Used**

Your component uses custom UI components:
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button` with variants (primary, secondary, outline)
- `Badge` with status (normal, warning, danger)
- `VitalSignCard` for displaying vital signs

All these are already implemented in your component! ✅

---

## 🔐 **Security**

### Authentication Flow

```javascript
// 1. Initial request with token
let response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// 2. If 403, logout
if (response.status === 403) {
  logout();
  return;
}

// 3. If 401, try refresh
if (response.status === 401) {
  const refreshResponse = await refresh();
  if (!refreshResponse) {
    logout();
    return;
  }
  // Retry request with new token
  response = await fetch(url, {...});
}
```

---

## 📊 **Data Relationships**

```
Medecin (Doctor)
  ↓ has many
Patient
  ↓ has many
RendezVous (Consultations)
  ↓ contains
  - Vital Signs (pulse, paSystolique, paDiastolique, poids, imc, pcm)
  - Notes
  - Date/Time

Patient
  ↓ has many
BiologicalRequest
  ↓ contains
  - Sample Types
  - Requested Exams
  - Results
  - Status
```

---

## ✅ **Everything Works!**

Your Patient Profile page is **fully functional** with:

- ✅ Patient information display
- ✅ Vital signs display
- ✅ Weight trend chart
- ✅ Heart rate trend chart
- ✅ Blood pressure trend chart
- ✅ Consultation history modal
- ✅ Biological data section
- ✅ Next appointment display
- ✅ Responsive design
- ✅ Authentication handling
- ✅ Error handling

**No backend changes needed! The endpoints already exist and work perfectly with your React component.** 🎉

---

## 🚀 **Quick Start**

1. **Start the backend:**
   ```bash
   cd /home/user/webapp
   npm run dev
   ```

2. **Navigate to patient profile:**
   ```
   http://localhost:5173/patient/123
   ```

3. **View patient data:**
   - Profile info automatically loads
   - Charts display consultation history
   - Click "Voir l'Historique" for detailed history

That's it! Everything is ready to use! 🎊
