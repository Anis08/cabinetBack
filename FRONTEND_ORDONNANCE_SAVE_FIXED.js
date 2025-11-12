// ✅ CORRECTED handleSave function for OrdonnanceEditor
// Replace your current handleSave function with this

const handleSave = async () => {
  if (medicaments.length === 0) {
    alert('Veuillez ajouter au moins un médicament')
    return
  }

  try {
    const token = localStorage.getItem('token')
    
    // Préparer les données pour l'API - Format corrigé
    const ordonnanceData = {
      // ✅ IMPORTANT: Use patient.id (integer), not patient._id
      patientId: parseInt(patient.id || patient._id),
      
      // Date de validité (30 jours par défaut)
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Note/observations
      note: observations || '',
      
      // Format des médicaments corrigé pour correspondre au backend
      medicaments: medicaments.map(med => {
        // Option 1: Si le médicament vient de la base (a un ID)
        if (med.id || med.medicamentId) {
          return {
            medicamentId: parseInt(med.id || med.medicamentId),
            posologie: med.frequence || med.posologie || '1 fois par jour',
            duree: med.duree || '7 jours',
            instructions: med.instructions || med.momentPrise || ''
          }
        }
        
        // Option 2: Si c'est un médicament personnalisé (sans ID)
        // Le backend cherchera s'il existe ou créera une demande
        return {
          nom: med.nom,
          dosage: med.dosage,
          forme: med.forme,
          fabricant: med.fabricant || 'Non spécifié',
          moleculeMere: med.moleculeMere || med.nom,
          type: med.type || 'Autre',
          posologie: med.frequence || med.posologie || '1 fois par jour',
          duree: med.duree || '7 jours',
          instructions: med.instructions || med.momentPrise || ''
        }
      })
    }

    console.log('Sending ordonnance data:', ordonnanceData) // Debug

    // Appel API vers le backend
    const response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(ordonnanceData)
    })

    const data = await response.json()

    if (response.ok) {
      if (response.status === 201) {
        // Ordonnance créée avec succès
        alert('Ordonnance créée avec succès!')
        
        // Si des demandes de médicaments ont été créées
        if (data.demandesCreated && data.demandesCreated.length > 0) {
          alert(
            `Ordonnance créée. ${data.demandesCreated.length} demande(s) de médicament(s) en attente de validation:\n` +
            data.demandesCreated.map(d => `- ${d.nom} ${d.dosage}`).join('\n')
          )
        }
        
        // Appeler le callback parent avec l'ordonnance complète
        if (onSave) {
          onSave(data.ordonnance)
        }
        
        // Fermer le modal ou rediriger
        if (onClose) {
          onClose()
        }
      } else if (response.status === 202) {
        // Seulement des demandes créées (aucun médicament validé)
        alert(
          'Demandes de médicaments créées. L\'ordonnance sera disponible après validation.\n\n' +
          'Médicaments en attente:\n' +
          data.demandes.map(d => `- ${d.nom} ${d.dosage} (${d.status})`).join('\n')
        )
        
        if (onClose) {
          onClose()
        }
      }
    } else {
      // Erreur du serveur
      console.error('Server error:', data)
      alert(`Erreur lors de la création: ${data.message || 'Erreur inconnue'}`)
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ordonnance:', error)
    alert(`Erreur de connexion: ${error.message}`)
  }
}

// ===============================================
// ALTERNATIVE: Version avec gestion d'erreurs améliorée
// ===============================================

const handleSaveEnhanced = async () => {
  // Validation
  if (medicaments.length === 0) {
    alert('Veuillez ajouter au moins un médicament')
    return
  }

  // Validation des médicaments
  const invalidMeds = medicaments.filter(med => {
    const hasId = med.id || med.medicamentId
    const hasFullData = med.nom && med.dosage && med.forme
    return !hasId && !hasFullData
  })

  if (invalidMeds.length > 0) {
    alert('Certains médicaments ont des données incomplètes')
    return
  }

  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      alert('Vous devez être connecté')
      return
    }

    // Préparer les données
    const ordonnanceData = {
      patientId: parseInt(patient.id || patient._id),
      dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      note: observations || '',
      medicaments: medicaments.map(med => {
        const medData = {
          posologie: med.frequence || med.posologie || '1 fois par jour',
          duree: med.duree || '7 jours',
          instructions: med.instructions || med.momentPrise || ''
        }

        // Si le médicament a un ID (vient de la base)
        if (med.id || med.medicamentId) {
          medData.medicamentId = parseInt(med.id || med.medicamentId)
        } else {
          // Médicament personnalisé
          medData.nom = med.nom
          medData.dosage = med.dosage
          medData.forme = med.forme
          medData.fabricant = med.fabricant || 'Non spécifié'
          medData.moleculeMere = med.moleculeMere || med.nom
          medData.type = med.type || 'Autre'
        }

        return medData
      })
    }

    console.log('📤 Sending ordonnance:', ordonnanceData)

    // Appel API
    const response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(ordonnanceData)
    })

    const data = await response.json()
    console.log('📥 Server response:', data)

    // Gestion des différents cas
    if (response.status === 201) {
      // ✅ Succès complet
      console.log('✅ Ordonnance créée:', data.ordonnance)
      
      let message = 'Ordonnance créée avec succès!'
      
      if (data.demandesCreated && data.demandesCreated.length > 0) {
        message += `\n\n⚠️ ${data.demandesCreated.length} médicament(s) nécessite(nt) validation:\n`
        message += data.demandesCreated.map(d => `• ${d.nom} ${d.dosage}`).join('\n')
      }
      
      alert(message)
      
      if (onSave) onSave(data.ordonnance)
      if (onClose) onClose()
      
    } else if (response.status === 202) {
      // ⚠️ Demandes créées, ordonnance en attente
      console.log('⚠️ Demandes créées:', data.demandes)
      
      alert(
        '⚠️ Tous les médicaments nécessitent validation.\n\n' +
        'Médicaments en attente:\n' +
        data.demandes.map(d => `• ${d.nom} ${d.dosage}`).join('\n') +
        '\n\nL\'ordonnance sera disponible après approbation.'
      )
      
      if (onClose) onClose()
      
    } else if (response.status === 400) {
      // ❌ Erreur de validation
      console.error('❌ Validation error:', data.message)
      alert(`Erreur de validation:\n${data.message}`)
      
    } else if (response.status === 404) {
      // ❌ Patient non trouvé
      console.error('❌ Patient not found')
      alert('Patient non trouvé ou n\'appartient pas à ce médecin')
      
    } else if (response.status === 401 || response.status === 403) {
      // ❌ Authentification
      console.error('❌ Authentication error')
      alert('Session expirée. Veuillez vous reconnecter.')
      // Optionnel: Rediriger vers login
      // window.location.href = '/login'
      
    } else {
      // ❌ Autre erreur
      console.error('❌ Server error:', data)
      alert(`Erreur serveur: ${data.message || 'Erreur inconnue'}`)
    }

  } catch (error) {
    console.error('💥 Network error:', error)
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      alert('Erreur de connexion au serveur. Vérifiez votre connexion internet.')
    } else {
      alert(`Erreur: ${error.message}`)
    }
  }
}

// ===============================================
// USAGE EXAMPLE
// ===============================================

// Dans votre composant OrdonnanceEditor:
/*
import { useState } from 'react'
import { baseURL } from '../config'

const OrdonnanceEditor = ({ patient, onSave, onClose }) => {
  const [medicaments, setMedicaments] = useState([])
  const [observations, setObservations] = useState('')

  // Use handleSave or handleSaveEnhanced
  const handleSave = async () => {
    // ... code above ...
  }

  return (
    <div>
      // ... your UI ...
      <button onClick={handleSave}>Créer l'ordonnance</button>
    </div>
  )
}
*/

// ===============================================
// NOTES IMPORTANTES
// ===============================================

/*
1. Format des médicaments acceptés par le backend:

   Option A - Médicament existant (avec ID):
   {
     medicamentId: 123,
     posologie: "1 comprimé 3 fois par jour",
     duree: "7 jours",
     instructions: "Après les repas"
   }

   Option B - Médicament personnalisé (sans ID):
   {
     nom: "Doliprane",
     dosage: "1000mg",
     forme: "Comprimé",
     fabricant: "Sanofi",
     moleculeMere: "Paracétamol",
     type: "Antalgique",
     posologie: "1 comprimé 3 fois par jour",
     duree: "7 jours",
     instructions: "Après les repas"
   }

2. Champs flexibles (le backend accepte plusieurs noms):
   - posologie OU frequence
   - medicamentId OU id
   - instructions OU momentPrise

3. Valeurs par défaut:
   - duree: "7 jours"
   - posologie: "1 fois par jour"
   - note: ""

4. Patient ID:
   - DOIT être un integer: parseInt(patient.id)
   - Pas un string ou ObjectId MongoDB

5. Réponses du backend:
   - 201: Ordonnance créée avec succès
   - 202: Demandes créées, ordonnance en attente
   - 400: Erreur de validation
   - 404: Patient non trouvé
   - 401/403: Authentification requise
   - 500: Erreur serveur

6. Token refresh:
   Si vous utilisez useAuth, ajoutez la gestion du refresh:
   
   const { refresh, logout } = useAuth()
   
   if (response.status === 401 || response.status === 403) {
     const refreshed = await refresh()
     if (refreshed) {
       // Retry request
     } else {
       logout()
     }
   }
*/

export default handleSave
export { handleSaveEnhanced }
