# Complete Ordonnances Integration Guide

## 📋 Overview

This guide provides complete integration between the React frontend and the backend API for the Ordonnances (Prescriptions) system.

## 🎯 Features Implemented

### Backend Endpoints (✅ All Ready)

1. **GET /medecin/ordonnances** - List all ordonnances with filters
2. **GET /medecin/ordonnances/:id** - Get specific ordonnance details
3. **GET /medecin/ordonnances/patient/:patientId** - Get patient's ordonnances
4. **POST /medecin/ordonnances** - Create new ordonnance
5. **PUT /medecin/ordonnances/:id** - Update ordonnance
6. **DELETE /medecin/ordonnances/:id** - Delete ordonnance
7. **GET /medecin/medicaments/search?q=term** - Autocomplete search for medications

### Frontend Features

1. ✅ Display ordonnances list with patient info
2. ✅ Statistics dashboard (total, this month, today)
3. ✅ Search/filter ordonnances
4. ✅ Create new ordonnance with patient selection
5. ✅ Edit existing ordonnance
6. ✅ Delete ordonnance
7. ✅ View ordonnance details
8. ✅ Medication autocomplete in editor
9. 🔄 PDF generation (TODO)

## 🔧 Implementation Details

### 1. Fetching All Ordonnances

**Endpoint:** `GET /medecin/ordonnances`

**Frontend Code:**
```javascript
const fetchOrdonnances = async () => {
  try {
    setLoading(true)
    let response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      credentials: 'include',
    })

    // Handle token refresh if 401/403
    if (!response.ok && (response.status === 403 || response.status === 401)) {
      const refreshResponse = await refresh()
      if (!refreshResponse) {
        logout()
        return
      }
      // Retry with new token
      response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      })
    }

    if (response.ok) {
      const data = await response.json()
      setOrdonnances(data.ordonnances || [])
      setStats(data.stats || { total: 0, thisMonth: 0, today: 0 })
    }
  } catch (error) {
    console.error('Error fetching ordonnances:', error)
    setOrdonnances([])
  } finally {
    setLoading(false)
  }
}
```

**Response Format:**
```json
{
  "ordonnances": [
    {
      "id": 1,
      "patientId": 5,
      "medecinId": 2,
      "dateCreation": "2024-11-12T10:30:00.000Z",
      "dateValidite": "2024-12-12T00:00:00.000Z",
      "note": "Repos recommandé",
      "patient": {
        "id": 5,
        "fullName": "Marie Dubois",
        "phoneNumber": "+33612345678",
        "dateOfBirth": "1990-05-15T00:00:00.000Z"
      },
      "medicaments": [
        {
          "medicament": {
            "id": 10,
            "nom": "Doliprane",
            "dosage": "1000mg",
            "forme": "Comprimé",
            "type": "Antalgique"
          },
          "posologie": "1 comprimé 3 fois par jour",
          "duree": "5 jours",
          "instructions": "Prendre après les repas"
        }
      ]
    }
  ],
  "count": 15,
  "stats": {
    "total": 15,
    "thisMonth": 8,
    "today": 2
  }
}
```

### 2. Creating a New Ordonnance

**Endpoint:** `POST /medecin/ordonnances`

**Frontend Code:**
```javascript
const handleSaveOrdonnance = async (ordonnanceData) => {
  try {
    const token = localStorage.getItem('token')
    
    // Transform medicaments to match API format
    const requestBody = {
      patientId: parseInt(selectedPatient.id || selectedPatient._id),
      dateValidite: ordonnanceData.dateValidite || null,
      note: ordonnanceData.observations || ordonnanceData.note || '',
      rendezVousId: ordonnanceData.rendezVousId || null,
      medicaments: ordonnanceData.medicaments.map(med => ({
        medicamentId: med.medicamentId || med.id,
        posologie: med.frequence || med.posologie || '1 fois par jour',
        duree: med.duree || '1 mois',
        instructions: med.instructions || ''
      }))
    }

    const response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erreur lors de la création')
    }

    const data = await response.json()
    
    if (response.status === 201) {
      alert('Ordonnance créée avec succès!')
      setIsEditorOpen(false)
      fetchOrdonnances() // Refresh list
    } else if (response.status === 202) {
      // Medication request created
      alert('Demande de médicament créée. L\'ordonnance sera disponible après validation.')
    }
  } catch (error) {
    console.error('Error saving ordonnance:', error)
    alert(`Erreur: ${error.message}`)
  }
}
```

**Request Body:**
```json
{
  "patientId": 5,
  "dateValidite": "2024-12-31",
  "note": "Repos recommandé pendant 48h",
  "rendezVousId": 12,
  "medicaments": [
    {
      "medicamentId": 10,
      "posologie": "1 comprimé 3 fois par jour",
      "duree": "5 jours",
      "instructions": "Prendre après les repas"
    },
    {
      "medicamentId": 15,
      "posologie": "2 comprimés matin et soir",
      "duree": "7 jours",
      "instructions": "À jeun"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "message": "Ordonnance créée avec succès",
  "ordonnance": {
    "id": 20,
    "patientId": 5,
    "medecinId": 2,
    "dateCreation": "2024-11-12T10:30:00.000Z",
    "dateValidite": "2024-12-31T00:00:00.000Z",
    "note": "Repos recommandé pendant 48h",
    "patient": { ... },
    "medicaments": [ ... ]
  }
}
```

### 3. Updating an Ordonnance

**Endpoint:** `PUT /medecin/ordonnances/:id`

**Frontend Code:**
```javascript
const handleEditOrdonnance = async (ordonnance) => {
  try {
    const token = localStorage.getItem('token')
    
    // First, fetch full ordonnance details
    const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      setEditingOrdonnance(data.ordonnance)
      setSelectedPatient(data.ordonnance.patient)
      setIsEditorOpen(true)
    }
  } catch (error) {
    console.error('Error loading ordonnance for edit:', error)
    alert('Erreur lors du chargement de l\'ordonnance')
  }
}

// Then in handleSaveOrdonnance, check if editing:
if (editingOrdonnance) {
  response = await fetch(`${baseURL}/medecin/ordonnances/${editingOrdonnance.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(requestBody)
  })
}
```

### 4. Deleting an Ordonnance

**Endpoint:** `DELETE /medecin/ordonnances/:id`

**Frontend Code:**
```javascript
const handleDeleteOrdonnance = async (ordonnance) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'ordonnance?`)) {
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (response.ok) {
      alert('Ordonnance supprimée avec succès')
      fetchOrdonnances() // Refresh list
    } else {
      const errorData = await response.json()
      alert(`Erreur: ${errorData.message}`)
    }
  } catch (error) {
    console.error('Error deleting ordonnance:', error)
    alert('Erreur lors de la suppression')
  }
}
```

### 5. Medication Autocomplete

**Endpoint:** `GET /medecin/medicaments/search?q=term`

**Frontend Code (in OrdonnanceEditor or MedicamentAutocomplete):**
```javascript
const searchMedicaments = async (searchTerm) => {
  if (searchTerm.length < 2) {
    setMedicaments([])
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `${baseURL}/medecin/medicaments/search?q=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    )

    if (response.ok) {
      const data = await response.json()
      setMedicaments(data.medicaments || [])
      setShowDropdown(true)
    }
  } catch (error) {
    console.error('Error searching medicaments:', error)
    setMedicaments([])
  }
}

// Use with debouncing (300ms)
useEffect(() => {
  const timeoutId = setTimeout(() => searchMedicaments(searchTerm), 300)
  return () => clearTimeout(timeoutId)
}, [searchTerm])
```

**Response Format:**
```json
{
  "medicaments": [
    {
      "id": 10,
      "nom": "Doliprane",
      "dosage": "1000mg",
      "forme": "Comprimé",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "3 fois par jour"
    },
    {
      "id": 11,
      "nom": "Doliprane",
      "dosage": "500mg",
      "forme": "Comprimé",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "3 fois par jour"
    }
  ],
  "count": 2
}
```

## 📁 File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── Ordonnances.jsx                  # Main ordonnances page
│   ├── components/
│   │   └── Ordonnances/
│   │       ├── OrdonnanceEditor.jsx         # Editor modal (with autocomplete)
│   │       ├── OrdonnancesList.jsx          # List component
│   │       ├── MedicamentAutocomplete.jsx   # Autocomplete input
│   │       └── OrdonnanceViewer.jsx         # Detail viewer (TODO)
│   └── config.js                            # baseURL configuration

backend/
├── src/
│   ├── routes/
│   │   ├── ordonnances.js                   # Ordonnance routes
│   │   └── medicaments.js                   # Medicament routes
│   ├── controllers/
│   │   ├── ordonnanceController.js          # Ordonnance logic
│   │   └── medicamentController.js          # Medicament logic
│   ├── middleware/
│   │   └── verifyAccessToken.js             # JWT verification
│   └── prisma.js                            # Prisma client
```

## 🔐 Authentication

All endpoints require JWT authentication:

```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

The token is verified by `verifyAccessToken` middleware which extracts `medecinId` from the JWT.

## 🚨 Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "message": "Token invalide ou expiré"
}
```

**400 Bad Request:**
```json
{
  "message": "Patient ID et au moins un médicament sont requis"
}
```

**404 Not Found:**
```json
{
  "message": "Ordonnance non trouvée ou n'appartient pas à ce médecin"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Erreur lors de la création de l'ordonnance",
  "error": "Detailed error message"
}
```

### Frontend Error Handling Pattern

```javascript
try {
  let response = await fetch(url, options)
  
  // Handle authentication errors
  if (!response.ok && (response.status === 401 || response.status === 403)) {
    const refreshResponse = await refresh()
    if (!refreshResponse) {
      logout()
      return
    }
    // Retry with new token
    response = await fetch(url, options)
  }
  
  if (response.ok) {
    const data = await response.json()
    // Handle success
  } else {
    const errorData = await response.json()
    alert(`Erreur: ${errorData.message}`)
  }
} catch (error) {
  console.error('Error:', error)
  alert('Une erreur inattendue s\'est produite')
}
```

## 📋 Query Parameters

### GET /medecin/ordonnances

- `patientId` (number, optional) - Filter by patient
- `startDate` (ISO string, optional) - Filter by start date
- `endDate` (ISO string, optional) - Filter by end date
- `limit` (number, optional, default: 50) - Limit results

**Example:**
```javascript
fetch(`${baseURL}/medecin/ordonnances?patientId=5&limit=20`)
```

### GET /medecin/medicaments/search

- `q` (string, required, min 2 chars) - Search term

**Example:**
```javascript
fetch(`${baseURL}/medecin/medicaments/search?q=dolip`)
```

## 🎨 UI Components Integration

### 1. Replace Ordonnances.jsx

Copy the complete implementation from `FRONTEND_ORDONNANCES_COMPLETE.jsx` to your `src/pages/Ordonnances.jsx`

### 2. Update OrdonnanceEditor Component

Make sure your `OrdonnanceEditor` component:
- Uses `MedicamentAutocomplete` for medication selection
- Accepts `ordonnance` prop for editing mode
- Calls `onSave` with properly formatted data

### 3. Add MedicamentAutocomplete Component

Use the autocomplete component from `MedicamentAutocomplete.jsx` (created earlier in AUTOCOMPLETE_MEDICAMENTS_GUIDE.md)

## ✅ Testing Checklist

### Backend Tests

```bash
# 1. List all ordonnances
curl -X GET http://localhost:4000/medecin/ordonnances \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Create ordonnance
curl -X POST http://localhost:4000/medecin/ordonnances \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "note": "Test ordonnance",
    "medicaments": [
      {
        "medicamentId": 1,
        "posologie": "1 comprimé 3 fois par jour",
        "duree": "5 jours"
      }
    ]
  }'

# 3. Search medications
curl -X GET "http://localhost:4000/medecin/medicaments/search?q=dolip" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Delete ordonnance
curl -X DELETE http://localhost:4000/medecin/ordonnances/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Tests

1. ✅ Login and navigate to Ordonnances page
2. ✅ Verify statistics display correctly
3. ✅ Click "Nouvelle Ordonnance" - patient selector opens
4. ✅ Select a patient - editor opens
5. ✅ Search for medication - autocomplete works
6. ✅ Add medication - appears in list
7. ✅ Add notes and validity date
8. ✅ Click "Créer" - ordonnance is created
9. ✅ Verify ordonnance appears in list
10. ✅ Click edit - editor opens with data
11. ✅ Modify and save - changes persist
12. ✅ Click delete - ordonnance is removed
13. ✅ Search by patient name - results filter

## 🔄 Next Steps (Optional)

### PDF Generation

Implement PDF generation for ordonnances:

```javascript
const handleDownloadOrdonnance = async (ordonnance) => {
  try {
    const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ordonnance-${ordonnance.id}.pdf`
      a.click()
    }
  } catch (error) {
    console.error('Error downloading PDF:', error)
  }
}
```

Backend route to implement:
```javascript
router.get('/:id/pdf', generateOrdonnancePDF)
```

### Email/WhatsApp Sending

Send ordonnance to patient via email or WhatsApp:

```javascript
router.post('/:id/send', sendOrdonnanceToPatient)
```

## 📚 Related Documentation

- [API_ORDONNANCES_PRISMA.md](./API_ORDONNANCES_PRISMA.md) - Complete API reference
- [AUTOCOMPLETE_MEDICAMENTS_GUIDE.md](./AUTOCOMPLETE_MEDICAMENTS_GUIDE.md) - Autocomplete implementation
- [FIX_ORDONNANCE_PRISMA_ERROR.md](./FIX_ORDONNANCE_PRISMA_ERROR.md) - Troubleshooting guide
- [URGENT_ACTION_REQUIRED.md](./URGENT_ACTION_REQUIRED.md) - Quick setup guide

## 💡 Tips

1. **Always use `parseInt()`** when sending IDs to backend (they're integers in PostgreSQL)
2. **Handle 401/403** errors with token refresh pattern
3. **Debounce search** inputs (300ms recommended)
4. **Show loading states** for better UX
5. **Validate data** before sending to backend
6. **Use try-catch** for all async operations
7. **Test with real data** after migration

## 🐛 Troubleshooting

**Problem:** "Cannot read properties of undefined (reading 'create')"
**Solution:** Run `npx prisma generate` and restart server

**Problem:** 401 errors
**Solution:** Check JWT token is valid and not expired

**Problem:** Empty ordonnances list
**Solution:** Verify database has ordonnances or create test data

**Problem:** Autocomplete not working
**Solution:** Check `/medecin/medicaments/search` endpoint returns data

---

**Status:** ✅ All endpoints implemented and tested
**Last Updated:** 2024-11-12
**Version:** 1.0.0
