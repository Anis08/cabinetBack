# ✅ Backend Activated - Frontend Integration Guide

## 🎉 Good News!

All features are now **ACTIVE** in the backend:
- ✅ Email and address fields
- ✅ Complementary exams with database persistence
- ✅ File upload for exams

---

## 📋 What You Need to Do in Frontend

Update your `PatientProfile.jsx` component with the following changes:

---

### 1. Add useEffect to Load Exams (Add after existing useEffect)

```javascript
// Fetch complementary exams on component mount
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

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  fetchComplementaryExams();
}, [patientId, refresh, logout]);
```

---

### 2. Update handleSaveExam (Replace entire function)

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
    alert('Une erreur est survenue.');
  }
};
```

---

### 3. Update handleDeleteExam

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

    if (response.ok) {
      setExams(exams.filter(exam => exam.id !== examId));
      alert('Examen supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  }
};
```

---

### 4. Update handleFileUploadForExam

```javascript
const handleFileUploadForExam = async (examId, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
    alert('Type de fichier non supporté. PDF, images ou DICOM uniquement.');
    return;
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('Fichier trop volumineux. Maximum 50 MB.');
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

    if (response.ok) {
      const data = await response.json();
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: [...(exam.files || []), data.file] }
          : exam
      ));
      alert('Fichier uploadé avec succès !');
    } else {
      alert('Erreur lors de l\'upload.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  } finally {
    setUploadingFile(false);
  }
};
```

---

### 5. Update handleDeleteFile

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

    if (response.ok) {
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: (exam.files || []).filter(f => f.id !== fileId) }
          : exam
      ));
      alert('Fichier supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  }
};
```

---

### 6. Update handlePreviewFile and handleDownloadFile

```javascript
const handlePreviewFile = (file) => {
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const fileWithFullUrl = { ...file, url: fullUrl };
  setSelectedPreviewFile(fileWithFullUrl);
  setShowFilePreview(true);
};

const handleDownloadFile = (file) => {
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = file.fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

---

### 7. Update Edit Patient Modal Form (Add email and address fields)

In your edit patient modal, add these fields:

```javascript
{/* Email */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Email
  </label>
  <input
    type="email"
    value={editForm.email || ''}
    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="patient@example.com"
  />
</div>

{/* Address */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Adresse
  </label>
  <textarea
    value={editForm.address || ''}
    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
    rows={2}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    placeholder="Adresse complète"
  />
</div>
```

---

### 8. Update handleUpdatePatient to include email and address

Make sure your `handleUpdatePatient` sends email and address:

```javascript
body: JSON.stringify({
  fullName: editForm.fullName,
  dateOfBirth: editForm.dateOfBirth,
  gender: editForm.gender,
  phoneNumber: editForm.phoneNumber,
  email: editForm.email,        // ← Add this
  address: editForm.address,    // ← Add this
  maladieChronique: editForm.maladieChronique
}),
```

---

## 🧪 Testing Checklist

After implementing the changes:

### Test Patient Profile:
- [ ] Open patient profile page
- [ ] Verify email and address fields display (if they have values)
- [ ] Click "Modifier" button
- [ ] See email and address input fields in modal
- [ ] Update email and address
- [ ] Save changes
- [ ] Verify new values display correctly

### Test Complementary Exams:
- [ ] Click "Nouvel examen" button
- [ ] Fill in type, description, and date
- [ ] Click "Créer"
- [ ] Verify exam appears in list
- [ ] **Refresh page** - exam should still be there (saved in DB!)
- [ ] Click to expand exam
- [ ] Upload a PDF file
- [ ] Verify file appears
- [ ] Click "Voir" (preview) - file should display
- [ ] Click "Télécharger" (download) - file should download
- [ ] Delete file
- [ ] Delete exam
- [ ] **Refresh page** - deleted items should stay deleted

---

## ✅ Success Criteria

After integration, you should have:

1. ✅ Email and address editable in patient profile
2. ✅ Exams save to database (persist after refresh)
3. ✅ Files upload to server (persist after refresh)
4. ✅ Files are previewable and downloadable
5. ✅ Delete operations work correctly
6. ✅ No console errors

---

## 📊 API Endpoints Now Active

All these endpoints are working:

```
GET    /medecin/profile-patient/:id
PUT    /medecin/patients/:id
DELETE /medecin/patients/:id

GET    /medecin/complementary-exams/patient/:patientId
POST   /medecin/complementary-exams
PUT    /medecin/complementary-exams/:examId
DELETE /medecin/complementary-exams/:examId
POST   /medecin/complementary-exams/:examId/files
DELETE /medecin/complementary-exams/files/:fileId
```

---

## 🆘 If Something Doesn't Work

### 1. Check Server Logs
```bash
# Look for any errors
npm run dev
```

### 2. Test API with cURL
```bash
# Test get exams
curl -X GET http://localhost:4000/medecin/complementary-exams/patient/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test create exam
curl -X POST http://localhost:4000/medecin/complementary-exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Test",
    "date": "2024-11-10"
  }'
```

### 3. Check Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab to see API responses

### 4. Verify Database
```sql
-- Check if tables exist
SELECT * FROM "ComplementaryExam" LIMIT 1;
SELECT * FROM "ExamFile" LIMIT 1;

-- Check if email/address columns exist
SELECT email, address FROM "Patient" LIMIT 1;
```

---

## 📚 Additional Resources

- **PATIENT_MANAGEMENT_API.md** - Complete API documentation
- **ACTIVER_EXAMENS_COMPLEMENTAIRES.md** - Detailed setup guide
- **FRONTEND_FIX_UPDATE_PATIENT.md** - Fix for page refresh issues

---

## ✨ Summary

**Backend Status:** ✅ **FULLY ACTIVATED**
- Email/address fields: ✅ Active
- Complementary exams: ✅ Active
- File upload: ✅ Active
- All endpoints: ✅ Working

**Frontend Status:** ⏳ **NEEDS INTEGRATION**
- Copy the 8 code sections above
- Test each feature
- Should work immediately!

---

**Date:** November 10, 2024  
**Commit:** 5ee3f11  
**Status:** ✅ **BACKEND READY - INTEGRATE FRONTEND**
