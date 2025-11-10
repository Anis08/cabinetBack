# Frontend Integration Guide - PatientProfile Component

This guide shows how to integrate the backend API with your PatientProfile.jsx component.

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints Integration](#api-endpoints-integration)
3. [Complete Code Examples](#complete-code-examples)
4. [Important Notes](#important-notes)

---

## Overview

Your PatientProfile component already has the UI and state management set up. You just need to connect the API calls to the backend endpoints.

### Backend Base URL
```javascript
import { baseURL } from "../config"
// Typically: http://localhost:4000
```

### Authentication
All requests require JWT token from `localStorage.getItem('token')`

---

## API Endpoints Integration

### 1. Fetch Complementary Exams on Component Mount

Replace the empty `exams` state initialization with actual API call:

```javascript
// Add this useEffect after the existing getPatient useEffect
useEffect(() => {
  const fetchComplementaryExams = async () => {
    if (!patientId) return;
    
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

      if (response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      }
    } catch (error) {
      console.error('Error fetching complementary exams:', error);
    }
  };

  fetchComplementaryExams();
}, [patientId, refresh, logout]);
```

---

### 2. Update Patient Information (Already Implemented - Just Update Endpoint)

Your `handleUpdatePatient` function is already good! Just make sure the endpoint matches:

```javascript
// Your existing code is correct:
const response = await fetch(`${baseURL}/medecin/patients/${patientId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(editForm),
});
```

✅ **This is correct!** The backend endpoint is `PUT /medecin/patients/:id`

---

### 3. Delete Patient (Already Implemented - Just Update Endpoint)

Your `handleDeletePatient` function is already good!

```javascript
// Your existing code is correct:
const response = await fetch(`${baseURL}/medecin/patients/${patientId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  credentials: 'include',
});
```

✅ **This is correct!** The backend endpoint is `DELETE /medecin/patients/:id`

---

### 4. Create Complementary Exam

Replace your `handleSaveExam` function with API call:

```javascript
const handleSaveExam = async () => {
  if (!examForm.type || !examForm.description || !examForm.date) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    let response;
    
    if (currentExam) {
      // UPDATE existing exam
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/${currentExam.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            type: examForm.type,
            description: examForm.description,
            date: examForm.date
          }),
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
          `${baseURL}/medecin/complementary-exams/${currentExam.id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              type: examForm.type,
              description: examForm.description,
              date: examForm.date
            }),
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setExams(exams.map(exam => 
          exam.id === currentExam.id ? data.exam : exam
        ));
        alert('Examen mis à jour avec succès !');
      }
    } else {
      // CREATE new exam
      response = await fetch(`${baseURL}/medecin/complementary-exams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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

      // Handle token refresh
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        response = await fetch(`${baseURL}/medecin/complementary-exams`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      }

      if (response.ok) {
        const data = await response.json();
        setExams([...exams, data.exam]);
        alert('Examen créé avec succès !');
      }
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (!response.ok) {
      alert('Erreur lors de l\'enregistrement de l\'examen.');
      return;
    }

    setShowExamModal(false);
    setCurrentExam(null);
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de l\'enregistrement de l\'examen.');
  }
};
```

---

### 5. Delete Complementary Exam

Replace your `handleDeleteExam` function:

```javascript
const handleDeleteExam = async (examId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
    return;
  }

  try {
    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/${examId}`,
      {
        method: 'DELETE',
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
        `${baseURL}/medecin/complementary-exams/${examId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (response.ok) {
      setExams(exams.filter(exam => exam.id !== examId));
      alert('Examen supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression de l\'examen.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de la suppression de l\'examen.');
  }
};
```

---

### 6. Upload File for Exam

Replace your `handleFileUploadForExam` function:

```javascript
const handleFileUploadForExam = async (examId, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/dicom'];
  const ext = file.name.toLowerCase();
  if (!validTypes.includes(file.type) && !ext.endsWith('.dcm')) {
    alert('Type de fichier non supporté. Veuillez uploader un PDF, une image (JPG, PNG, GIF) ou un fichier DICOM.');
    return;
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('Le fichier est trop volumineux. La taille maximale est de 50 MB.');
    return;
  }

  setUploadingFile(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/${examId}/files`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: formData,
      }
    );

    // Handle token refresh
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (!refreshResponse) {
        logout();
        setUploadingFile(false);
        return;
      }
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/${examId}/files`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: formData,
        }
      );
    }

    if (response.status === 403) {
      logout();
      setUploadingFile(false);
      return;
    }

    if (response.ok) {
      const data = await response.json();
      
      // Update exams state with new file
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: [...exam.files, data.file] }
          : exam
      ));

      alert('Fichier uploadé avec succès !');
    } else {
      alert('Erreur lors de l\'upload du fichier.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de l\'upload du fichier.');
  } finally {
    setUploadingFile(false);
  }
};
```

---

### 7. Delete Exam File

Replace your `handleDeleteFile` function:

```javascript
const handleDeleteFile = async (examId, fileId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
    return;
  }

  try {
    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/files/${fileId}`,
      {
        method: 'DELETE',
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
        `${baseURL}/medecin/complementary-exams/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (response.ok) {
      // Update exams state to remove deleted file
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: exam.files.filter(f => f.id !== fileId) }
          : exam
      ));
      alert('Fichier supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression du fichier.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue lors de la suppression du fichier.');
  }
};
```

---

### 8. Preview File

Update your `handlePreviewFile` function to use backend URL:

```javascript
const handlePreviewFile = (file) => {
  // Create full URL for the file
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const fileWithFullUrl = { ...file, url: fullUrl };
  
  setSelectedPreviewFile(fileWithFullUrl);
  setShowFilePreview(true);
};
```

---

### 9. Download File

Update your `handleDownloadFile` function:

```javascript
const handleDownloadFile = (file) => {
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = file.fileName;
  link.target = '_blank'; // Open in new tab as fallback
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

---

## Complete Code Examples

### Complete PatientProfile Component with Backend Integration

Here's a summary of all the changes you need to make:

1. **Add useEffect for fetching exams:**

```javascript
// Add this after the existing getPatient useEffect
useEffect(() => {
  const fetchComplementaryExams = async () => {
    if (!patientId) return;
    
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

      if (response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      }
    } catch (error) {
      console.error('Error fetching complementary exams:', error);
    }
  };

  fetchComplementaryExams();
}, [patientId, refresh, logout]);
```

2. **Update file URL handling:**

In your file display, update to use backend URL:

```javascript
// In the files table, update the preview and download buttons:
<button
  onClick={() => handlePreviewFile(file)}
  className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
  title="Voir"
>
  <Eye className="w-4 h-4" />
</button>

// And update the preview modal to show correct URLs:
{selectedPreviewFile && (
  <img
    src={`${baseURL}/${selectedPreviewFile.fileUrl}`}
    alt={selectedPreviewFile.fileName}
    className="w-full h-auto rounded-lg"
  />
)}
```

---

## Important Notes

### 1. File URLs

Backend returns relative URLs like `uploads/exams/exam-123456.pdf`

You need to prepend `baseURL` to access them:
```javascript
const fullUrl = `${baseURL}/${file.fileUrl}`;
```

### 2. Date Formatting

Backend returns ISO format dates. Your frontend already handles this correctly with:
```javascript
new Date(exam.date).toLocaleDateString('fr-FR')
```

### 3. Exam Types

Make sure your `examTypes` array matches the backend expectations:
```javascript
const examTypes = [
  'Échographie rénale',
  'Scanner/IRM',
  'ECBU',
  'Biopsie rénale',
  "Bilan d'imagerie vasculaire"
];
```

### 4. File Size Display

Your `formatFileSize` function is already correct!

### 5. File Icon Logic

Your `getFileIcon` function is already correct!

---

## Testing Checklist

After integration, test these scenarios:

### Patient Management
- [ ] Update patient information
- [ ] Delete patient (verify cascade delete works)
- [ ] View updated patient profile

### Complementary Exams
- [ ] Fetch exams on page load
- [ ] Create new exam
- [ ] Edit existing exam
- [ ] Delete exam
- [ ] Upload PDF file
- [ ] Upload image file (JPG, PNG)
- [ ] Preview uploaded file
- [ ] Download uploaded file
- [ ] Delete uploaded file

### Error Handling
- [ ] Test with expired token (should refresh automatically)
- [ ] Test with invalid patient ID
- [ ] Test file upload with wrong file type
- [ ] Test file upload exceeding 50MB
- [ ] Test without internet connection

---

## Migration Required

⚠️ **IMPORTANT:** Before using these features, run the database migration:

```bash
cd /home/user/webapp
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

This will create the necessary database tables.

---

## API Response Examples

### Get Exams Response
```json
{
  "exams": [
    {
      "id": 1,
      "patientId": 1,
      "type": "Échographie rénale",
      "description": "Résultats normaux",
      "date": "2024-11-15T00:00:00.000Z",
      "createdAt": "2024-11-15T10:30:00.000Z",
      "updatedAt": "2024-11-15T10:30:00.000Z",
      "files": [
        {
          "id": 1,
          "examId": 1,
          "fileName": "echographie.pdf",
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

### Create Exam Response
```json
{
  "message": "Complementary exam created successfully",
  "exam": {
    "id": 1,
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Résultats normaux",
    "date": "2024-11-15T00:00:00.000Z",
    "createdAt": "2024-11-15T10:30:00.000Z",
    "updatedAt": "2024-11-15T10:30:00.000Z",
    "files": []
  }
}
```

### Upload File Response
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "examId": 1,
    "fileName": "echographie.pdf",
    "fileUrl": "uploads/exams/exam-1731234567890-123456789.pdf",
    "fileType": "application/pdf",
    "fileSize": 2458632,
    "uploadDate": "2024-11-15T10:35:00.000Z"
  }
}
```

---

## Support

For detailed API documentation, see `PATIENT_MANAGEMENT_API.md`

For backend code, check:
- `src/controllers/medecinController.js` - Patient update/delete
- `src/controllers/complementaryExamController.js` - Exams CRUD
- `src/routes/complementaryExams.js` - Routes configuration

---

**Last Updated:** November 10, 2024
