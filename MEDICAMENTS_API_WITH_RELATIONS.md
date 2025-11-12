# Medicaments API - Complete with All Relations

## Overview

All medicament endpoints now return complete data including all relations:
- **medecin** - Who created the medication (if custom)
- **ordonnanceMedicaments** - Usage history in prescriptions
- **demandeMedicaments** - Medication requests status
- **_count** - Statistics of usage

## 🔗 Updated Endpoints

### 1. GET /medecin/medicaments - List All Medications

**Returns medications with:**
- ✅ Creator (medecin) info
- ✅ Last 5 usage records in prescriptions
- ✅ Pending medication requests
- ✅ Statistics

**Request:**
```bash
curl -X GET "http://localhost:4000/medecin/medicaments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `search` - Search in name, molecule, manufacturer
- `type` - Filter by type (Antalgique, Antibiotique, etc.)
- `moleculeMere` - Filter by active molecule
- `dosage` - Filter by dosage
- `dateDebut` - Start date filter
- `dateFin` - End date filter

**Response Format:**
```json
{
  "medicaments": [
    {
      "id": 1,
      "nom": "Doliprane",
      "dosage": "1000mg",
      "forme": "Comprimé",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "3 fois par jour",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "medecinId": null,
      "medecin": null,
      "ordonnanceMedicaments": [
        {
          "id": 45,
          "ordonnanceId": 20,
          "posologie": "1 comprimé 3 fois par jour",
          "duree": "5 jours"
        },
        {
          "id": 42,
          "ordonnanceId": 18,
          "posologie": "2 comprimés matin et soir",
          "duree": "7 jours"
        }
      ],
      "demandeMedicaments": [
        {
          "id": 5,
          "status": "EnAttente",
          "createdAt": "2024-11-10T08:30:00Z"
        }
      ]
    },
    {
      "id": 2,
      "nom": "Amoxicilline",
      "dosage": "500mg",
      "forme": "Gélule",
      "fabricant": "Biogaran",
      "moleculeMere": "Amoxicilline",
      "type": "Antibiotique",
      "frequence": "2 fois par jour",
      "createdAt": "2024-02-20T14:30:00Z",
      "updatedAt": "2024-02-20T14:30:00Z",
      "medecinId": 2,
      "medecin": {
        "id": 2,
        "fullName": "Dr. Jean Dupont",
        "speciality": "Médecine Générale"
      },
      "ordonnanceMedicaments": [
        {
          "id": 50,
          "ordonnanceId": 25,
          "posologie": "1 gélule matin et soir",
          "duree": "10 jours"
        }
      ],
      "demandeMedicaments": []
    }
  ],
  "stats": {
    "total": 2,
    "types": 2,
    "fabricants": 2
  },
  "message": "Médicaments récupérés avec succès"
}
```

**Use Cases:**
- Display full medication inventory
- Show who created custom medications
- See usage history for each medication
- Track pending requests

---

### 2. GET /medecin/medicaments/search?q=term - Autocomplete Search

**Returns medications with:**
- ✅ Creator (medecin) info
- ✅ Usage count (_count)

**Request:**
```bash
curl -X GET "http://localhost:4000/medecin/medicaments/search?q=dolip" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `q` (required, min 2 chars) - Search term

**Response Format:**
```json
{
  "medicaments": [
    {
      "id": 1,
      "nom": "Doliprane",
      "dosage": "1000mg",
      "forme": "Comprimé",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "3 fois par jour",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "medecinId": null,
      "medecin": null,
      "_count": {
        "ordonnanceMedicaments": 45
      }
    },
    {
      "id": 10,
      "nom": "Doliprane",
      "dosage": "500mg",
      "forme": "Comprimé",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "3 fois par jour",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "medecinId": null,
      "medecin": null,
      "_count": {
        "ordonnanceMedicaments": 32
      }
    }
  ],
  "count": 2
}
```

**Use Cases:**
- Autocomplete in ordonnance editor
- Show usage popularity (count)
- Display medication creator

---

### 3. GET /medecin/medicaments/:id - Get Single Medication

**Returns medication with:**
- ✅ Full creator (medecin) details
- ✅ Last 10 usage records with patient info
- ✅ All medication requests with status
- ✅ Complete usage statistics

**Request:**
```bash
curl -X GET "http://localhost:4000/medecin/medicaments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Format:**
```json
{
  "medicament": {
    "id": 1,
    "nom": "Doliprane",
    "dosage": "1000mg",
    "forme": "Comprimé",
    "fabricant": "Sanofi",
    "moleculeMere": "Paracétamol",
    "type": "Antalgique",
    "frequence": "3 fois par jour",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "medecinId": 2,
    "medecin": {
      "id": 2,
      "fullName": "Dr. Jean Dupont",
      "speciality": "Médecine Générale",
      "phoneNumber": "+33612345678",
      "email": "jean.dupont@example.com"
    },
    "ordonnanceMedicaments": [
      {
        "id": 45,
        "ordonnanceId": 20,
        "posologie": "1 comprimé 3 fois par jour",
        "duree": "5 jours",
        "instructions": "Prendre après les repas",
        "ordonnance": {
          "id": 20,
          "dateCreation": "2024-11-12T10:30:00Z",
          "patient": {
            "id": 5,
            "fullName": "Marie Dubois"
          }
        }
      },
      {
        "id": 42,
        "ordonnanceId": 18,
        "posologie": "2 comprimés matin et soir",
        "duree": "7 jours",
        "instructions": "À jeun",
        "ordonnance": {
          "id": 18,
          "dateCreation": "2024-11-10T14:20:00Z",
          "patient": {
            "id": 3,
            "fullName": "Jean Martin"
          }
        }
      }
      // ... up to 10 most recent usages
    ],
    "demandeMedicaments": [
      {
        "id": 5,
        "status": "Acceptee",
        "motifRejet": null,
        "createdAt": "2024-11-01T08:00:00Z",
        "dateTraitement": "2024-11-02T09:30:00Z",
        "medecin": {
          "id": 2,
          "fullName": "Dr. Jean Dupont"
        }
      },
      {
        "id": 3,
        "status": "EnAttente",
        "motifRejet": null,
        "createdAt": "2024-10-28T12:15:00Z",
        "dateTraitement": null,
        "medecin": {
          "id": 2,
          "fullName": "Dr. Jean Dupont"
        }
      }
    ],
    "_count": {
      "ordonnanceMedicaments": 45,
      "demandeMedicaments": 2
    }
  }
}
```

**Use Cases:**
- View complete medication details
- See full usage history
- Track medication requests
- Display statistics and analytics
- Show which patients received this medication

---

### 4. POST /medecin/medicaments - Create New Medication

**Returns created medication with:**
- ✅ Creator (medecin) info
- ✅ Initial counts (0)

**Request:**
```bash
curl -X POST "http://localhost:4000/medecin/medicaments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Ibuprofène",
    "dosage": "400mg",
    "forme": "Comprimé",
    "fabricant": "Biogaran",
    "moleculeMere": "Ibuprofène",
    "type": "Anti-inflammatoire",
    "frequence": "3 fois par jour"
  }'
```

**Request Body:**
```json
{
  "nom": "Ibuprofène",
  "dosage": "400mg",
  "forme": "Comprimé",
  "fabricant": "Biogaran",
  "moleculeMere": "Ibuprofène",
  "type": "Anti-inflammatoire",
  "frequence": "3 fois par jour"
}
```

**Response Format (201 Created):**
```json
{
  "message": "Médicament créé avec succès",
  "medicament": {
    "id": 50,
    "nom": "Ibuprofène",
    "dosage": "400mg",
    "forme": "Comprimé",
    "fabricant": "Biogaran",
    "moleculeMere": "Ibuprofène",
    "type": "Anti-inflammatoire",
    "frequence": "3 fois par jour",
    "createdAt": "2024-11-12T15:30:00Z",
    "updatedAt": "2024-11-12T15:30:00Z",
    "medecinId": 2,
    "medecin": {
      "id": 2,
      "fullName": "Dr. Jean Dupont",
      "speciality": "Médecine Générale"
    },
    "_count": {
      "ordonnanceMedicaments": 0,
      "demandeMedicaments": 0
    }
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "message": "Ce médicament existe déjà dans la base de données",
  "medicament": {
    "id": 1,
    "nom": "Ibuprofène",
    "dosage": "400mg",
    "forme": "Comprimé"
  }
}
```

---

### 5. PUT /medecin/medicaments/:id - Update Medication

**Returns updated medication with:**
- ✅ Creator (medecin) info
- ✅ Updated counts

**Request:**
```bash
curl -X PUT "http://localhost:4000/medecin/medicaments/50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Ibuprofène",
    "dosage": "600mg",
    "forme": "Comprimé",
    "fabricant": "Biogaran",
    "moleculeMere": "Ibuprofène",
    "type": "Anti-inflammatoire",
    "frequence": "2 fois par jour"
  }'
```

**Response Format (200 OK):**
```json
{
  "message": "Médicament modifié avec succès",
  "medicament": {
    "id": 50,
    "nom": "Ibuprofène",
    "dosage": "600mg",
    "forme": "Comprimé",
    "fabricant": "Biogaran",
    "moleculeMere": "Ibuprofène",
    "type": "Anti-inflammatoire",
    "frequence": "2 fois par jour",
    "createdAt": "2024-11-12T15:30:00Z",
    "updatedAt": "2024-11-12T16:45:00Z",
    "medecinId": 2,
    "medecin": {
      "id": 2,
      "fullName": "Dr. Jean Dupont",
      "speciality": "Médecine Générale"
    },
    "_count": {
      "ordonnanceMedicaments": 5,
      "demandeMedicaments": 0
    }
  }
}
```

---

### 6. DELETE /medecin/medicaments/:id - Delete Medication

**Request:**
```bash
curl -X DELETE "http://localhost:4000/medecin/medicaments/50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Format (200 OK):**
```json
{
  "message": "Médicament supprimé avec succès",
  "medicamentId": 50
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Ce médicament ne peut pas être supprimé car il est utilisé dans des ordonnances",
  "ordonnancesCount": 15
}
```

---

## 📊 Relation Details

### medecin (Creator)

Who created this medication (for custom medications):

```json
{
  "id": 2,
  "fullName": "Dr. Jean Dupont",
  "speciality": "Médecine Générale",
  "phoneNumber": "+33612345678",  // Only in GET /:id
  "email": "jean.dupont@example.com"  // Only in GET /:id
}
```

**null** for global/system medications.

### ordonnanceMedicaments (Usage History)

How this medication has been used in prescriptions:

**In GET / (list):**
- Last 5 usages
- Basic info only

```json
{
  "id": 45,
  "ordonnanceId": 20,
  "posologie": "1 comprimé 3 fois par jour",
  "duree": "5 jours"
}
```

**In GET /:id (details):**
- Last 10 usages
- Full info with ordonnance and patient

```json
{
  "id": 45,
  "ordonnanceId": 20,
  "posologie": "1 comprimé 3 fois par jour",
  "duree": "5 jours",
  "instructions": "Prendre après les repas",
  "ordonnance": {
    "id": 20,
    "dateCreation": "2024-11-12T10:30:00Z",
    "patient": {
      "id": 5,
      "fullName": "Marie Dubois"
    }
  }
}
```

### demandeMedicaments (Medication Requests)

Requests to add this medication:

**In GET / (list):**
- Only pending requests (`status: "EnAttente"`)

```json
{
  "id": 5,
  "status": "EnAttente",
  "createdAt": "2024-11-10T08:30:00Z"
}
```

**In GET /:id (details):**
- All requests (all statuses)
- Full info with requester

```json
{
  "id": 5,
  "status": "Acceptee",
  "motifRejet": null,
  "createdAt": "2024-11-01T08:00:00Z",
  "dateTraitement": "2024-11-02T09:30:00Z",
  "medecin": {
    "id": 2,
    "fullName": "Dr. Jean Dupont"
  }
}
```

**Statuses:**
- `EnAttente` - Pending approval
- `Acceptee` - Approved
- `Rejetee` - Rejected

### _count (Statistics)

Usage statistics:

```json
{
  "ordonnanceMedicaments": 45,  // Times used in prescriptions
  "demandeMedicaments": 2        // Number of requests for this medication
}
```

**Only in:**
- GET /search (ordonnanceMedicaments count only)
- GET /:id (both counts)
- POST / (both counts, initially 0)
- PUT /:id (both counts)

---

## 🔍 Frontend Integration Examples

### Display Medication with Creator

```javascript
const MedicationCard = ({ medicament }) => (
  <div className="p-4 border rounded-lg">
    <h3 className="font-bold">{medicament.nom} {medicament.dosage}</h3>
    <p className="text-sm text-gray-600">{medicament.moleculeMere}</p>
    <p className="text-xs text-gray-500">
      {medicament.forme} - {medicament.fabricant}
    </p>
    
    {medicament.medecin && (
      <div className="mt-2 text-xs text-blue-600">
        Créé par: {medicament.medecin.fullName}
      </div>
    )}
    
    {medicament._count && (
      <div className="mt-2 text-xs text-gray-500">
        Utilisé {medicament._count.ordonnanceMedicaments} fois
      </div>
    )}
  </div>
)
```

### Autocomplete with Usage Count

```javascript
const AutocompleteItem = ({ medicament }) => (
  <button className="w-full text-left p-2 hover:bg-blue-50">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium">{medicament.nom} {medicament.dosage}</p>
        <p className="text-sm text-gray-600">{medicament.forme} - {medicament.type}</p>
      </div>
      {medicament._count && (
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {medicament._count.ordonnanceMedicaments} usages
        </span>
      )}
    </div>
  </button>
)
```

### Medication Details Page

```javascript
const MedicationDetails = ({ medicament }) => (
  <div className="space-y-6">
    {/* Basic Info */}
    <div>
      <h1 className="text-2xl font-bold">{medicament.nom}</h1>
      <p className="text-gray-600">{medicament.moleculeMere}</p>
    </div>
    
    {/* Creator */}
    {medicament.medecin && (
      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold">Créé par</h3>
        <p>{medicament.medecin.fullName}</p>
        <p className="text-sm text-gray-600">{medicament.medecin.speciality}</p>
        <p className="text-sm">{medicament.medecin.phoneNumber}</p>
      </div>
    )}
    
    {/* Usage History */}
    <div>
      <h3 className="font-semibold mb-2">
        Historique d'utilisation ({medicament._count.ordonnanceMedicaments} total)
      </h3>
      {medicament.ordonnanceMedicaments.map(usage => (
        <div key={usage.id} className="p-3 border rounded mb-2">
          <p className="font-medium">{usage.ordonnance.patient.fullName}</p>
          <p className="text-sm">{usage.posologie}</p>
          <p className="text-xs text-gray-500">
            {new Date(usage.ordonnance.dateCreation).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
    
    {/* Requests */}
    {medicament.demandeMedicaments.length > 0 && (
      <div>
        <h3 className="font-semibold mb-2">
          Demandes ({medicament._count.demandeMedicaments})
        </h3>
        {medicament.demandeMedicaments.map(demande => (
          <div key={demande.id} className="p-3 border rounded mb-2">
            <span className={`inline-block px-2 py-1 rounded text-xs ${
              demande.status === 'Acceptee' ? 'bg-green-100 text-green-800' :
              demande.status === 'Rejetee' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {demande.status}
            </span>
            <p className="text-sm mt-1">Par: {demande.medecin.fullName}</p>
            <p className="text-xs text-gray-500">
              {new Date(demande.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
)
```

---

## 🎯 Use Cases

### 1. Medication Inventory Management
- View all medications with creators
- See usage statistics
- Track pending requests

### 2. Prescription Analytics
- Which medications are most prescribed
- Usage history per medication
- Patient medication tracking

### 3. Custom Medication Tracking
- Who created custom medications
- Approval status of custom medications
- Usage of custom vs global medications

### 4. Audit Trail
- Complete history of medication usage
- Who prescribed what to whom
- When medications were added/modified

---

## 🔄 Changes Summary

| Endpoint | Before | After |
|----------|--------|-------|
| GET / | Basic fields only | + medecin, ordonnanceMedicaments (5), demandeMedicaments (pending) |
| GET /search | Basic fields only | + medecin, _count.ordonnanceMedicaments |
| GET /:id | Basic fields only | + medecin (full), ordonnanceMedicaments (10 with details), demandeMedicaments (all), _count |
| POST / | Basic fields only | + medecin, _count |
| PUT /:id | Basic fields only | + medecin, _count |
| DELETE /:id | No change | Same |

---

## 📝 Notes

1. **Performance:** Relations are optimized with `take` limits and selective fields
2. **Privacy:** Sensitive patient data limited to ID and name
3. **Consistency:** All endpoints follow same relation pattern
4. **Flexibility:** Frontend can choose what to display from rich data

---

**Updated:** 2024-11-12  
**Status:** ✅ All endpoints updated with relations  
**Version:** 2.0.0 (with relations)
