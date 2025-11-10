# Patient Management & Complementary Exams API Documentation

This document describes the API endpoints for patient management (update/delete) and complementary exams management.

## Table of Contents
1. [Patient Management](#patient-management)
2. [Complementary Exams Management](#complementary-exams-management)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Frontend Integration](#frontend-integration)

---

## Patient Management

### 1. Update Patient Information

**Endpoint:** `PUT /medecin/patients/:id`

**Authentication:** Required (JWT token)

**Description:** Update patient information including personal details and medical history.

**Request Parameters:**
- `id` (path parameter): Patient ID

**Request Body:**
```json
{
  "fullName": "Marie DUBOIS",
  "dateOfBirth": "1970-05-15",
  "gender": "Femme",
  "phoneNumber": "+33 6 12 34 56 78",
  "email": "marie.dubois@example.com",
  "address": "123 Rue de Paris, 75001 Paris",
  "maladieChronique": "Hypertension artérielle"
}
```

**Required Fields:**
- `fullName`: Patient's full name
- `dateOfBirth`: Date of birth (ISO format)
- `gender`: "Homme" or "Femme"

**Optional Fields:**
- `phoneNumber`: Phone number
- `email`: Email address
- `address`: Home address
- `maladieChronique`: Chronic disease/condition

**Success Response (200):**
```json
{
  "message": "Patient updated successfully",
  "patient": {
    "id": 1,
    "fullName": "Marie DUBOIS",
    "phoneNumber": "+33 6 12 34 56 78",
    "email": "marie.dubois@example.com",
    "address": "123 Rue de Paris, 75001 Paris",
    "gender": "Femme",
    "dateOfBirth": "1970-05-15T00:00:00.000Z",
    "maladieChronique": "Hypertension artérielle",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Full name, date of birth, and gender are required"
}
```

- **404 Not Found:**
```json
{
  "message": "Patient not found or does not belong to this doctor"
}
```

- **409 Conflict:**
```json
{
  "message": "Phone number or full name already exists"
}
```

---

### 2. Delete Patient

**Endpoint:** `DELETE /medecin/patients/:id`

**Authentication:** Required (JWT token)

**Description:** Delete a patient and all associated data (appointments, exams, biological requests, etc.). This action is irreversible.

**Request Parameters:**
- `id` (path parameter): Patient ID

**Success Response (200):**
```json
{
  "message": "Patient deleted successfully",
  "patientId": 1
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Patient not found or does not belong to this doctor"
}
```

- **500 Internal Server Error:**
```json
{
  "message": "Failed to delete patient",
  "error": "Error details"
}
```

**⚠️ Important Notes:**
- All related data is deleted via CASCADE:
  - All appointments (RendezVous)
  - All biological requests
  - All complementary exams and their files
- Files stored on disk are also deleted
- This action cannot be undone

---

## Complementary Exams Management

### 3. Get All Complementary Exams for a Patient

**Endpoint:** `GET /medecin/complementary-exams/patient/:patientId`

**Authentication:** Required (JWT token)

**Description:** Retrieve all complementary exams for a specific patient, including associated files.

**Request Parameters:**
- `patientId` (path parameter): Patient ID

**Success Response (200):**
```json
{
  "exams": [
    {
      "id": 1,
      "patientId": 1,
      "type": "Échographie rénale",
      "description": "Échographie des reins réalisée le 15 novembre 2024. Résultats normaux, pas d'anomalie détectée.",
      "date": "2024-11-15T00:00:00.000Z",
      "createdAt": "2024-11-15T10:30:00.000Z",
      "updatedAt": "2024-11-15T10:30:00.000Z",
      "files": [
        {
          "id": 1,
          "examId": 1,
          "fileName": "echographie-reins.pdf",
          "fileUrl": "uploads/exams/exam-1731234567890-123456789.pdf",
          "fileType": "application/pdf",
          "fileSize": 2458632,
          "uploadDate": "2024-11-15T10:35:00.000Z"
        }
      ]
    }
  ]
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Patient not found or does not belong to this doctor"
}
```

---

### 4. Create Complementary Exam

**Endpoint:** `POST /medecin/complementary-exams`

**Authentication:** Required (JWT token)

**Description:** Create a new complementary exam for a patient.

**Request Body:**
```json
{
  "patientId": 1,
  "type": "Échographie rénale",
  "description": "Échographie des reins réalisée le 15 novembre 2024. Résultats normaux.",
  "date": "2024-11-15"
}
```

**Required Fields:**
- `patientId`: Patient ID
- `type`: Type of exam (e.g., "Échographie rénale", "Scanner/IRM", "ECBU", "Biopsie rénale", "Bilan d'imagerie vasculaire")
- `description`: Exam description and results
- `date`: Exam date (ISO format)

**Success Response (201):**
```json
{
  "message": "Complementary exam created successfully",
  "exam": {
    "id": 1,
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Échographie des reins réalisée le 15 novembre 2024. Résultats normaux.",
    "date": "2024-11-15T00:00:00.000Z",
    "createdAt": "2024-11-15T10:30:00.000Z",
    "updatedAt": "2024-11-15T10:30:00.000Z",
    "files": []
  }
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Patient ID, type, description, and date are required"
}
```

- **404 Not Found:**
```json
{
  "message": "Patient not found or does not belong to this doctor"
}
```

---

### 5. Update Complementary Exam

**Endpoint:** `PUT /medecin/complementary-exams/:examId`

**Authentication:** Required (JWT token)

**Description:** Update an existing complementary exam.

**Request Parameters:**
- `examId` (path parameter): Exam ID

**Request Body:**
```json
{
  "type": "Scanner/IRM",
  "description": "Scanner cérébral avec injection de produit de contraste. Résultats mis à jour.",
  "date": "2024-11-20"
}
```

**All Fields Optional:**
- `type`: Type of exam
- `description`: Exam description
- `date`: Exam date

**Success Response (200):**
```json
{
  "message": "Complementary exam updated successfully",
  "exam": {
    "id": 1,
    "patientId": 1,
    "type": "Scanner/IRM",
    "description": "Scanner cérébral avec injection de produit de contraste. Résultats mis à jour.",
    "date": "2024-11-20T00:00:00.000Z",
    "createdAt": "2024-11-15T10:30:00.000Z",
    "updatedAt": "2024-11-20T14:45:00.000Z",
    "files": []
  }
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Exam not found or does not belong to your patient"
}
```

---

### 6. Delete Complementary Exam

**Endpoint:** `DELETE /medecin/complementary-exams/:examId`

**Authentication:** Required (JWT token)

**Description:** Delete a complementary exam and all associated files.

**Request Parameters:**
- `examId` (path parameter): Exam ID

**Success Response (200):**
```json
{
  "message": "Complementary exam deleted successfully",
  "examId": 1
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Exam not found or does not belong to your patient"
}
```

**⚠️ Important Notes:**
- All associated files are deleted from disk and database
- This action cannot be undone

---

### 7. Upload File for Exam

**Endpoint:** `POST /medecin/complementary-exams/:examId/files`

**Authentication:** Required (JWT token)

**Description:** Upload a file (PDF, image, or DICOM) for a complementary exam.

**Request Parameters:**
- `examId` (path parameter): Exam ID

**Request Body:**
- Content-Type: `multipart/form-data`
- Field name: `file`

**Supported File Types:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- DICOM: `application/dicom`, `application/x-dicom`, `.dcm` extension

**File Size Limit:** 50 MB

**Success Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "examId": 1,
    "fileName": "echographie-reins.pdf",
    "fileUrl": "uploads/exams/exam-1731234567890-123456789.pdf",
    "fileType": "application/pdf",
    "fileSize": 2458632,
    "uploadDate": "2024-11-15T10:35:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "No file uploaded"
}
```

- **404 Not Found:**
```json
{
  "message": "Exam not found or does not belong to your patient"
}
```

- **413 Payload Too Large:**
```json
{
  "message": "File too large. Maximum size is 50MB"
}
```

---

### 8. Delete Exam File

**Endpoint:** `DELETE /medecin/complementary-exams/files/:fileId`

**Authentication:** Required (JWT token)

**Description:** Delete a file from a complementary exam.

**Request Parameters:**
- `fileId` (path parameter): File ID

**Success Response (200):**
```json
{
  "message": "File deleted successfully",
  "fileId": 1
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "File not found or does not belong to your patient"
}
```

---

## Database Schema

### New Tables Added

#### ComplementaryExam Table
```prisma
model ComplementaryExam {
  id          Int         @id @default(autoincrement())
  patientId   Int
  type        String      // Type of exam
  description String      @db.Text
  date        DateTime
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  files       ExamFile[]
}
```

#### ExamFile Table
```prisma
model ExamFile {
  id        Int      @id @default(autoincrement())
  examId    Int
  fileName  String
  fileUrl   String
  fileType  String   // MIME type
  fileSize  Int      // Size in bytes
  uploadDate DateTime @default(now())
  
  exam      ComplementaryExam @relation(fields: [examId], references: [id], onDelete: Cascade)
}
```

### Updated Patient Table
Added new optional fields:
- `email`: Email address
- `address`: Home address

---

## Setup Instructions

### 1. Run Database Migration

After pulling the code, run the migration to update your database:

```bash
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

This will:
- Add `email` and `address` fields to Patient table
- Create `ComplementaryExam` table
- Create `ExamFile` table
- Add CASCADE delete rules for data integrity

### 2. Create Upload Directory

The upload directory for exam files is automatically created, but you can verify:

```bash
mkdir -p uploads/exams
```

### 3. Verify Static File Serving

The server.js already includes static file serving for `/uploads`:

```javascript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

Files will be accessible at: `http://localhost:4000/uploads/exams/filename.pdf`

---

## Frontend Integration

### Example: Update Patient

```javascript
const handleUpdatePatient = async () => {
  try {
    const response = await fetch(`${baseURL}/medecin/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName: editForm.fullName,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email,
        address: editForm.address,
        maladieChronique: editForm.maladieChronique
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setPatient(data.patient);
      alert('Patient mis à jour avec succès !');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Example: Delete Patient

```javascript
const handleDeletePatient = async () => {
  const confirmDelete = window.confirm(
    'Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.'
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${baseURL}/medecin/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    });

    if (response.ok) {
      alert('Patient supprimé avec succès.');
      navigate('/home/patients');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Example: Get Complementary Exams

```javascript
const fetchComplementaryExams = async () => {
  try {
    const response = await fetch(
      `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      }
    );

    if (response.ok) {
      const data = await response.json();
      setExams(data.exams);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Example: Create Complementary Exam

```javascript
const handleSaveExam = async () => {
  try {
    const response = await fetch(`${baseURL}/medecin/complementary-exams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        patientId: parseInt(patientId),
        type: examForm.type,
        description: examForm.description,
        date: examForm.date
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setExams([...exams, data.exam]);
      alert('Examen créé avec succès !');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Example: Upload File for Exam

```javascript
const handleFileUploadForExam = async (examId, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(
      `${baseURL}/medecin/complementary-exams/${examId}/files`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Update exams state with new file
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: [...exam.files, data.file] }
          : exam
      ));
      alert('Fichier uploadé avec succès !');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Example: Delete Exam File

```javascript
const handleDeleteFile = async (examId, fileId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
    return;
  }

  try {
    const response = await fetch(
      `${baseURL}/medecin/complementary-exams/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      }
    );

    if (response.ok) {
      // Update exams state to remove deleted file
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: exam.files.filter(f => f.id !== fileId) }
          : exam
      ));
      alert('Fichier supprimé avec succès !');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

---

## Complete Frontend Integration Example

Here's how to integrate all endpoints in the PatientProfile component:

```javascript
// Fetch exams on component mount
useEffect(() => {
  const fetchExams = async () => {
    try {
      let response = await fetch(
        `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      // Handle token refresh
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        response = await fetch(
          `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  if (patientId) {
    fetchExams();
  }
}, [patientId]);
```

---

## API Error Handling

All endpoints follow consistent error handling:

### Token Expiration (401)
```javascript
if (response.status === 401) {
  const refreshResponse = await refresh();
  if (!refreshResponse) {
    logout();
    return;
  }
  // Retry the request with new token
}
```

### Unauthorized Access (403)
```javascript
if (response.status === 403) {
  logout();
  return;
}
```

### Not Found (404)
```javascript
if (response.status === 404) {
  alert('Ressource non trouvée.');
  return;
}
```

### Server Error (500)
```javascript
if (response.status === 500) {
  alert('Erreur serveur. Veuillez réessayer plus tard.');
  return;
}
```

---

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Ownership Verification**: Doctors can only access/modify their own patients' data
3. **Cascade Delete**: Related data is properly cleaned up when deleting patients
4. **File Validation**: Only allowed file types (PDF, images, DICOM) can be uploaded
5. **File Size Limit**: Maximum 50MB per file
6. **Path Traversal Protection**: Multer handles file storage securely

---

## Testing the API

### Using cURL

**Update Patient:**
```bash
curl -X PUT http://localhost:4000/medecin/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Marie DUBOIS",
    "dateOfBirth": "1970-05-15",
    "gender": "Femme",
    "email": "marie@example.com"
  }'
```

**Create Exam:**
```bash
curl -X POST http://localhost:4000/medecin/complementary-exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Résultats normaux",
    "date": "2024-11-15"
  }'
```

**Upload File:**
```bash
curl -X POST http://localhost:4000/medecin/complementary-exams/1/files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

---

## Common Issues & Solutions

### Issue: "Patient not found or does not belong to this doctor"
**Solution:** Verify that:
- The patient ID is correct
- The patient belongs to the authenticated doctor
- The JWT token is valid

### Issue: "File upload fails"
**Solution:** Check:
- File size is under 50MB
- File type is supported (PDF, JPG, PNG, GIF, DICOM)
- Upload directory has proper permissions
- Multer is properly configured

### Issue: "Database migration fails"
**Solution:**
- Ensure DATABASE_URL is set in .env file
- Check database connection
- Run `npx prisma generate` before migration

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code in `src/controllers/`
3. Check server logs for error details
4. Verify JWT token validity

---

**Last Updated:** November 10, 2024
**API Version:** 1.0.0
