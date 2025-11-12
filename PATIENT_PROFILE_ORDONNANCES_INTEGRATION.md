# Patient Profile - Ordonnances Integration Guide

## 🎯 Overview

This guide explains how to integrate ordonnances (prescriptions) functionality into the PatientProfile page to make it fully functional.

---

## 🔧 Backend Changes (Already Implemented)

### 1. Enhanced `getPatientProfile` Endpoint

**Endpoint:** `GET /medecin/profile-patient/:id`

**Returns:**
```json
{
  "patient": {
    "id": 1,
    "fullName": "Marie DUBOIS",
    "phoneNumber": "+33612345678",
    "email": "marie.dubois@example.com",
    "address": "123 Rue de la Santé, Paris",
    "gender": "Féminin",
    "dateOfBirth": "1969-05-15T00:00:00.000Z",
    "maladieChronique": "Hypertension artérielle",
    "rendezVous": [
      {
        "id": 1,
        "date": "2024-11-01T00:00:00.000Z",
        "status": "Terminé",
        "note": "Patient en bonne santé générale...",
        "poids": 72.5,
        "imc": 24.2,
        "pcm": 70.1,
        "pulse": 78,
        "paSystolique": 145,
        "paDiastolique": 92
      }
    ]
  },
  "nextAppointment": {
    "id": 15,
    "date": "2024-12-15T00:00:00.000Z"
  },
  "ordonnances": [
    {
      "id": 1,
      "dateCreation": "2024-11-01T10:30:00.000Z",
      "dateValidite": "2024-12-01T00:00:00.000Z",
      "note": "Traitement de fond pour l'hypertension",
      "rendezVousId": 1,
      "medicaments": [
        {
          "medicament": {
            "id": 1,
            "nom": "Amlodipine",
            "dosage": "5mg",
            "forme": "Comprimé",
            "type": "Antihypertenseur"
          },
          "posologie": "1 comprimé par jour",
          "duree": "1 mois",
          "instructions": "À prendre le matin au petit-déjeuner"
        }
      ]
    }
  ]
}
```

### 2. Enhanced `getAllOrdonnances` Endpoint

**Endpoint:** `GET /medecin/ordonnances?patientId=:id`

**Returns:**
```json
{
  "ordonnances": [...],
  "count": 5,
  "stats": {
    "total": 5,
    "thisMonth": 2,
    "today": 1
  },
  "message": "Ordonnances récupérées avec succès"
}
```

---

## 📱 Frontend Implementation

### Step 1: Update the PatientProfile Component

Add ordonnances fetching in the `useEffect`:

```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { baseURL } from "../config";
import { useAuth } from '../store/AuthProvider';

const PatientProfile: React.FC = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [ordonnances, setOrdonnances] = useState<any[]>([]);
  const { logout, refresh } = useAuth();

  useEffect(() => {
    const getPatient = async () => {
      if (patient) return;
      try {
        let response = await fetch(`${baseURL}/medecin/profile-patient/${patientId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        });

        // Handle 401 with token refresh
        if (response.status === 401) {
          const refreshResponse = await refresh();
          if (!refreshResponse) {
            logout();
            return;
          }

          response = await fetch(`${baseURL}/medecin/profile-patient/${patientId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          });
        }

        if (response.status === 403) {
          logout();
          return;
        }

        if (response.status === 404) {
          alert('Aucun patient trouvé.');
          return;
        }

        if (!response.ok) {
          alert('Le serveur a rencontré une erreur. Veuillez réessayer plus tard.');
          return;
        }

        const data = await response.json();
        setPatient(data.patient);
        setNextAppointment(data.nextAppointment);
        
        // Set ordonnances from the patient profile response
        if (data.ordonnances) {
          setOrdonnances(transformOrdonnances(data.ordonnances));
        }

      } catch (error) {
        console.error('Error fetching patient:', error);
        alert('Une erreur est survenue lors de la récupération du patient.');
      }
    };

    getPatient();
  }, [patientId]);

  // Transform backend ordonnances data to match frontend format
  const transformOrdonnances = (ordonnances: any[]) => {
    return ordonnances.map(ord => ({
      _id: ord.id.toString(),
      numero: `ORD-${new Date(ord.dateCreation).getFullYear()}-${String(ord.id).padStart(4, '0')}`,
      date: ord.dateCreation,
      dateValidite: ord.dateValidite,
      observations: ord.note || '',
      rendezVousId: ord.rendezVousId,
      medicaments: ord.medicaments.map((m: any) => ({
        id: m.medicament.id,
        nom: m.medicament.nom,
        dosage: m.medicament.dosage,
        forme: m.medicament.forme,
        type: m.medicament.type,
        frequence: m.posologie,
        duree: m.duree,
        instructions: m.instructions
      }))
    }));
  };

  // ... rest of your component
}
```

### Step 2: Update the Ordonnances Section

The ordonnances section in your component should now work with the state:

```jsx
{/* Ordonnances Médicales Section */}
<div className="mb-8">
  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
    {/* Header with Purple gradient */}
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Ordonnances Médicales</h3>
      </div>
      <button
        onClick={() => setShowOrdonnanceEditor(true)}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Nouvelle ordonnance
      </button>
    </div>

    {/* Content Area */}
    {ordonnances && ordonnances.length > 0 ? (
      <div className="divide-y divide-gray-200">
        {ordonnances.map((ord, index) => (
          <div key={ord._id || index} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {new Date(ord.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {ord.numero}
                  </span>
                </div>

                <div className="space-y-2">
                  {ord.medicaments?.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-purple-500 mt-2"></div>
                      <div>
                        <span className="font-medium text-gray-800">
                          {med.nom} {med.dosage}
                        </span>
                        <span className="text-gray-600"> - {med.frequence}</span>
                        {med.duree && <span className="text-gray-500"> pendant {med.duree}</span>}
                        {med.instructions && (
                          <div className="text-xs text-gray-500 mt-1">
                            {med.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {ord.observations && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <p className="text-sm text-gray-700">{ord.observations}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewOrdonnance(ord)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Voir l'ordonnance"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDownloadOrdonnance(ord)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Télécharger PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Aucune ordonnance disponible</p>
        <button
          onClick={() => setShowOrdonnanceEditor(true)}
          className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Créer la première ordonnance
        </button>
      </div>
    )}
  </div>
</div>
```

### Step 3: Handle Ordonnance Creation

Update the `handleSaveOrdonnance` callback in the OrdonnanceEditor:

```jsx
const handleSaveOrdonnance = async (ordonnanceData: any) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      logout();
      return;
    }

    // Prepare request body
    const requestBody = {
      patientId: parseInt(patientId),
      dateValidite: ordonnanceData.dateValidite,
      note: ordonnanceData.observations,
      medicaments: ordonnanceData.medicaments.map((med: any) => {
        if (med.medicamentId) {
          // Existing medicament
          return {
            medicamentId: med.medicamentId,
            posologie: med.frequence,
            duree: med.duree,
            instructions: med.instructions
          };
        } else {
          // New medicament (will create demande)
          return {
            medicamentData: {
              nom: med.nom,
              dosage: med.dosage,
              forme: med.forme,
              fabricant: med.fabricant || 'Non spécifié',
              moleculeMere: med.moleculeMere || med.nom,
              type: med.type || 'Autre',
              frequence: med.frequence
            },
            posologie: med.frequence,
            duree: med.duree,
            instructions: med.instructions
          };
        }
      })
    };

    let response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    // Handle 401 with token refresh
    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (!refreshResponse) {
        logout();
        return;
      }

      response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création');
    }

    const data = await response.json();

    // Handle different response types
    if (response.status === 202) {
      // Only demandes created
      alert(`Demandes de médicaments créées. L'ordonnance sera créée après validation par l'admin.\n\n${data.demandes.length} médicament(s) en attente de validation.`);
    } else if (response.status === 201) {
      // Ordonnance created successfully
      let message = 'Ordonnance créée avec succès!';
      
      if (data.demandesCreated && data.demandesCreated.length > 0) {
        message += `\n\nNote: ${data.demandesCreated.length} médicament(s) nécessitent une validation admin.`;
      }
      
      alert(message);
      
      // Reload patient data to get updated ordonnances
      window.location.reload(); // Or re-fetch patient data
    }

    setShowOrdonnanceEditor(false);
    
  } catch (error) {
    console.error('Error saving ordonnance:', error);
    alert('Erreur lors de la création de l\'ordonnance: ' + error.message);
  }
};
```

### Step 4: Handle PDF Download (Optional Enhancement)

For PDF generation, you'll need to create a new endpoint or use a frontend library like `jspdf` or `react-to-pdf`:

```jsx
const handleDownloadOrdonnance = async (ordonnance: any) => {
  try {
    const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance._id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordonnance-${ordonnance.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading ordonnance:', error);
    alert('Fonctionnalité PDF en développement');
  }
};
```

---

## 🧪 Testing

### 1. Test Patient Profile Loading

1. Navigate to patient profile page
2. Check browser console for any errors
3. Verify that ordonnances section displays correctly
4. If ordonnances exist, they should appear in the list
5. If no ordonnances, "Aucune ordonnance disponible" message should show

### 2. Test Ordonnance Creation

1. Click "Nouvelle ordonnance" button
2. Fill in medicament details
3. Click save
4. Check that ordonnance appears in the list
5. Verify data matches what was entered

### 3. Test Ordonnance Display

1. Check that date displays correctly (French format)
2. Verify medicament details are shown
3. Check that instructions and observations appear when present
4. Test view and download buttons (even if not fully implemented)

---

## 🔐 Security Notes

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only the patient's assigned doctor can access their ordonnances
3. **Token Refresh**: Implement automatic token refresh on 401 responses
4. **Error Handling**: Always handle errors gracefully and show user-friendly messages

---

## 📊 Data Transformation

The backend returns ordonnances in a specific format. Make sure to transform it for your frontend:

**Backend Format:**
```json
{
  "id": 1,
  "dateCreation": "2024-11-01T10:30:00.000Z",
  "medicaments": [
    {
      "medicament": {
        "id": 1,
        "nom": "Amlodipine",
        "dosage": "5mg"
      },
      "posologie": "1 par jour",
      "duree": "1 mois"
    }
  ]
}
```

**Frontend Format:**
```json
{
  "_id": "1",
  "numero": "ORD-2024-0001",
  "date": "2024-11-01T10:30:00.000Z",
  "medicaments": [
    {
      "id": 1,
      "nom": "Amlodipine",
      "dosage": "5mg",
      "frequence": "1 par jour",
      "duree": "1 mois"
    }
  ]
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Aucune ordonnance disponible" shows when ordonnances exist

**Solution:** Check that the `transformOrdonnances` function is being called and state is being set correctly.

### Issue 2: 401 Unauthorized errors

**Solution:** 
- Check that token is stored correctly in localStorage
- Implement token refresh logic
- Verify token hasn't expired

### Issue 3: Ordonnance creation fails with validation errors

**Solution:**
- Check that all required fields are provided:
  - `patientId` (number)
  - `medicaments` (array with at least one item)
  - Each medicament must have `posologie`
- For new medicaments, provide full `medicamentData`

### Issue 4: Data doesn't update after creating ordonnance

**Solution:**
- Reload patient data after successful creation
- Or add the new ordonnance to the state manually
- Use `window.location.reload()` as a simple solution

---

## 📚 Related Documentation

- [MEDICAMENTS_ORDONNANCES_GUIDE.md](./MEDICAMENTS_ORDONNANCES_GUIDE.md) - Complete medicaments and ordonnances system
- [ORDONNANCES_INTEGRATION.md](./ORDONNANCES_INTEGRATION.md) - Ordonnances frontend integration guide
- [API_ENDPOINTS_SUMMARY.md](./API_ENDPOINTS_SUMMARY.md) - Complete API reference

---

## ✅ Checklist

Before deploying, ensure:

- [ ] Backend ordonnances endpoints are working
- [ ] Frontend fetches ordonnances on patient profile load
- [ ] Ordonnances display correctly with all medicament details
- [ ] New ordonnance creation works
- [ ] Error handling is implemented for all API calls
- [ ] Authentication token refresh is working
- [ ] Loading states are shown during API calls
- [ ] Success/error messages are user-friendly
- [ ] Data transformation between backend/frontend formats is correct
- [ ] Console shows no errors during normal operation

---

## 🚀 Next Steps

1. Implement PDF generation for ordonnances
2. Add ordonnance editing functionality
3. Add ordonnance deletion with confirmation
4. Implement ordonnance search/filter
5. Add ordonnance validity date warnings
6. Create ordonnance printing template

---

**Status:** ✅ Ready for Integration  
**Last Updated:** 2024-11-12
