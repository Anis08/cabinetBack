# Fix: "Aucun patient disponible" dans Ordonnances

## 🐛 Problème

Le message "Aucun patient disponible. Veuillez d'abord créer un patient." s'affiche même quand des patients existent dans la base de données.

## 🔍 Cause

Deux problèmes identifiés :

1. **Mauvais endpoint** : Le code utilise `/medecin/patients` mais l'API est `/medecin/list-patients`
2. **Mauvaise clé de token** : Utilise `localStorage.getItem('token')` au lieu de `'accessToken'`

## ✅ Solution

Mettez à jour la fonction `fetchPatients` dans votre fichier `Ordonnances.jsx` :

### ❌ Code Incorrect (Ancien)

```jsx
const fetchPatients = async () => {
  try {
    const token = localStorage.getItem('token')  // ❌ Mauvaise clé
    const response = await fetch(`${baseURL}/medecin/patients`, {  // ❌ Mauvais endpoint
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      setPatients(data.patients || [])  // ✅ Ceci est correct
    }
  } catch (error) {
    console.error('Error fetching patients:', error)
  }
}
```

### ✅ Code Correct (Nouveau)

```jsx
const fetchPatients = async () => {
  try {
    // Try both token keys
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    
    if (!token) {
      console.error('No authentication token found')
      return
    }

    // Correct endpoint: /medecin/list-patients
    const response = await fetch(`${baseURL}/medecin/list-patients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 401) {
      console.error('Authentication failed - token expired')
      logout()
      return
    }

    if (!response.ok) {
      console.error('Failed to fetch patients:', response.status)
      return
    }

    const data = await response.json()
    console.log('Patients fetched:', data.patients) // Debug log
    
    // API returns: { patients, averageAge, newPatientsThisMonth, patientsViewedThisWeek }
    setPatients(data.patients || [])
    
  } catch (error) {
    console.error('Error fetching patients:', error)
  }
}
```

## 📝 Code Complet pour Ordonnances.jsx

Remplacez toute la page `Ordonnances.jsx` par ce code :

```jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Search, Filter, Calendar, User, AlertCircle } from 'lucide-react'
import OrdonnanceEditor from '../components/Ordonnances/OrdonnanceEditor'
import OrdonnancesList from '../components/Ordonnances/OrdonnancesList'
import { baseURL } from '../config'
import { useAuth } from '../store/AuthProvider'

const Ordonnances = () => {
  const { logout, refresh } = useAuth()
  const [ordonnances, setOrdonnances] = useState([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, today: 0 })
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrdonnances()
    fetchPatients()
  }, [])

  const getAuthToken = () => {
    // Try both possible token keys
    return localStorage.getItem('accessToken') || localStorage.getItem('token')
  }

  const fetchOrdonnances = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getAuthToken()

      if (!token) {
        setError('Token d\'authentification manquant')
        logout()
        return
      }

      const response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        logout()
        return
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform data to match frontend format
      const transformedOrdonnances = (data.ordonnances || []).map(ord => ({
        _id: ord.id.toString(),
        numero: `ORD-${new Date(ord.dateCreation).getFullYear()}-${String(ord.id).padStart(4, '0')}`,
        patientId: ord.patientId,
        patientName: ord.patient.fullName,
        date: ord.dateCreation,
        dateValidite: ord.dateValidite,
        medicaments: ord.medicaments.map(m => ({
          id: m.medicament.id,
          nom: m.medicament.nom,
          dosage: m.medicament.dosage,
          forme: m.medicament.forme,
          type: m.medicament.type,
          frequence: m.posologie,
          duree: m.duree,
          instructions: m.instructions
        })),
        observations: ord.note || '',
        rendezVousId: ord.rendezVousId
      }))

      setOrdonnances(transformedOrdonnances)
      
      // Set stats
      if (data.stats) {
        setStats(data.stats)
      }
      
    } catch (error) {
      console.error('Error fetching ordonnances:', error)
      setError('Erreur lors du chargement des ordonnances: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const token = getAuthToken()
      
      if (!token) {
        console.error('No authentication token found')
        return
      }

      console.log('Fetching patients from:', `${baseURL}/medecin/list-patients`)

      const response = await fetch(`${baseURL}/medecin/list-patients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Patients response status:', response.status)

      if (response.status === 401) {
        console.error('Authentication failed - token expired')
        logout()
        return
      }

      if (response.status === 404) {
        console.log('No patients found (404)')
        setPatients([])
        return
      }

      if (!response.ok) {
        console.error('Failed to fetch patients:', response.status)
        return
      }

      const data = await response.json()
      console.log('Patients data received:', data)
      console.log('Number of patients:', data.patients?.length || 0)
      
      // API returns: { patients, averageAge, newPatientsThisMonth, patientsViewedThisWeek }
      setPatients(data.patients || [])
      
    } catch (error) {
      console.error('Error fetching patients:', error)
      setPatients([])
    }
  }

  const handleOpenEditor = () => {
    console.log('Opening editor, patients count:', patients.length)
    console.log('Patients:', patients)
    
    if (patients.length > 0) {
      setShowPatientSelector(true)
    } else {
      alert('Aucun patient disponible. Veuillez d\'abord créer un patient.')
    }
  }

  const handleSelectPatient = (patient) => {
    console.log('Selected patient:', patient)
    setSelectedPatient(patient)
    setShowPatientSelector(false)
    setIsEditorOpen(true)
  }

  const handleSaveOrdonnance = async (ordonnanceData) => {
    try {
      const token = getAuthToken()

      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.')
        logout()
        return
      }

      // Prepare request body
      const requestBody = {
        patientId: ordonnanceData.patientId,
        dateValidite: ordonnanceData.dateValidite,
        note: ordonnanceData.observations,
        medicaments: ordonnanceData.medicaments.map(med => {
          if (med.medicamentId) {
            // Existing medicament
            return {
              medicamentId: med.medicamentId,
              posologie: med.frequence,
              duree: med.duree,
              instructions: med.instructions
            }
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
            }
          }
        })
      }

      // Add rendezVousId if exists
      if (ordonnanceData.rendezVousId) {
        requestBody.rendezVousId = ordonnanceData.rendezVousId
      }

      console.log('Sending ordonnance:', requestBody)

      const response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.')
        logout()
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      const data = await response.json()

      // Handle different response types
      if (response.status === 202) {
        // Only demandes created
        alert(`Demandes de médicaments créées. L'ordonnance sera créée après validation par l'admin.\n\n${data.demandes.length} médicament(s) en attente de validation.`)
        setIsEditorOpen(false)
        setSelectedPatient(null)
      } else if (response.status === 201) {
        // Ordonnance created successfully
        let message = 'Ordonnance créée avec succès!'
        
        if (data.demandesCreated && data.demandesCreated.length > 0) {
          message += `\n\nNote: ${data.demandesCreated.length} médicament(s) nécessitent une validation admin.`
        }
        
        alert(message)
        setIsEditorOpen(false)
        setSelectedPatient(null)
        
        // Refresh ordonnances list
        await fetchOrdonnances()
      }
      
    } catch (error) {
      console.error('Error saving ordonnance:', error)
      alert('Erreur lors de la création de l\'ordonnance: ' + error.message)
    }
  }

  const handleViewOrdonnance = (ordonnance) => {
    console.log('View ordonnance:', ordonnance)
    // TODO: Implement view modal
  }

  const handleDownloadOrdonnance = (ordonnance) => {
    console.log('Download ordonnance:', ordonnance)
    alert('Fonctionnalité PDF en développement')
    // TODO: Implement PDF generation
  }

  const filteredOrdonnances = ordonnances.filter(ord =>
    ord.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ord.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement des ordonnances...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchOrdonnances}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Ordonnances Médicales
            </h1>
            <p className="text-gray-600 mt-1">Gestion des prescriptions médicales</p>
          </div>

          <button
            onClick={handleOpenEditor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Ordonnance
          </button>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ce mois</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par patient ou numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </motion.div>

      {/* Ordonnances List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des ordonnances ({filteredOrdonnances.length})
          </h3>
        </div>

        <OrdonnancesList
          ordonnances={filteredOrdonnances}
          onView={handleViewOrdonnance}
          onDownload={handleDownloadOrdonnance}
        />
      </motion.div>

      {/* Patient Selector Modal */}
      {showPatientSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Sélectionner un patient ({patients.length})
              </h3>
              <button
                onClick={() => setShowPatientSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {patients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun patient disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <p className="font-semibold text-gray-800">{patient.fullName}</p>
                      <p className="text-sm text-gray-600">
                        {patient.dateOfBirth && `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} ans`}
                        {patient.gender && ` • ${patient.gender}`}
                        {patient.phoneNumber && ` • ${patient.phoneNumber}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Ordonnance Editor Modal */}
      {selectedPatient && (
        <OrdonnanceEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
          onSave={handleSaveOrdonnance}
        />
      )}
    </div>
  )
}

export default Ordonnances
```

## 🧪 Comment Tester

1. **Ouvrir la console du navigateur** (F12)

2. **Naviguer vers la page Ordonnances**

3. **Vérifier les logs dans la console:**
   ```
   Fetching patients from: http://localhost:5000/medecin/list-patients
   Patients response status: 200
   Patients data received: { patients: [...], averageAge: 35, ... }
   Number of patients: 5
   ```

4. **Cliquer sur "Nouvelle Ordonnance"**

5. **Vérifier le log:**
   ```
   Opening editor, patients count: 5
   Patients: [...]
   ```

6. **Le sélecteur de patients devrait s'ouvrir** avec la liste des patients

## 🔍 Debugging

Si le problème persiste, vérifiez:

### 1. Token dans localStorage
```javascript
// Dans la console du navigateur
console.log('accessToken:', localStorage.getItem('accessToken'))
console.log('token:', localStorage.getItem('token'))
```

### 2. Réponse de l'API
```javascript
// Testez l'API directement
const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
fetch('http://localhost:5000/medecin/list-patients', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
```

### 3. Vérifiez que le backend tourne
```bash
# Dans le terminal backend
npm run dev
```

Devrait afficher:
```
Server running on port 5000
```

## 📋 Résumé des Changements

| Avant | Après |
|-------|-------|
| `/medecin/patients` | `/medecin/list-patients` |
| `localStorage.getItem('token')` | `getAuthToken()` (essaie les deux clés) |
| Pas de logs | Console logs pour debugging |
| Pas de gestion 404 | Gère le cas 404 (pas de patients) |
| `patient._id` | `patient.id` |

## 🎯 Résultat Attendu

Après cette correction, vous devriez:
- ✅ Voir vos patients dans le sélecteur
- ✅ Pouvoir créer des ordonnances
- ✅ Voir des logs utiles dans la console
- ✅ Avoir une meilleure gestion des erreurs
