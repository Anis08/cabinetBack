# 🔧 Fix: Ordonnances Stockées Localement au Lieu du Serveur

## 🐛 Problème Identifié

Les ordonnances sont enregistrées dans le **Local Storage** du navigateur au lieu d'être envoyées au backend via API.

**Preuve visible dans DevTools:**
```
Local storage > http://localhost:3000
- medicaments: [{"nom":"Dolide",...}]
- medicationRequests: [{"nom":"dolipriname",...}]
```

## 🎯 Cause

Le composant `OrdonnanceEditor` ou la page qui l'utilise sauvegarde les données localement avec:

```javascript
// ❌ MAUVAIS - Stockage local
localStorage.setItem('medicaments', JSON.stringify(medicaments));
localStorage.setItem('ordonnances', JSON.stringify(ordonnances));
```

Au lieu de faire un appel API vers le backend:

```javascript
// ✅ BON - Appel API
await fetch(`${baseURL}/medecin/ordonnances`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(ordonnanceData)
});
```

---

## ✅ Solution: Modifier le Code Frontend

### Étape 1: Trouver où les ordonnances sont sauvegardées

Cherchez dans votre code frontend les fichiers qui contiennent:
- `localStorage.setItem`
- `ordonnance`
- `medicament`

Fichiers probables:
- `OrdonnanceEditor.jsx`
- `PatientProfile.jsx`
- `Ordonnances.jsx`

### Étape 2: Remplacer le Stockage Local par un Appel API

**❌ Code Actuel (à remplacer):**

```jsx
const handleSaveOrdonnance = (ordonnanceData) => {
  // Stockage local - MAUVAIS
  const existingOrdonnances = JSON.parse(localStorage.getItem('ordonnances') || '[]');
  existingOrdonnances.push(ordonnanceData);
  localStorage.setItem('ordonnances', JSON.stringify(existingOrdonnances));
  
  alert('Ordonnance enregistrée!');
};
```

**✅ Code Correct (à utiliser):**

```jsx
const handleSaveOrdonnance = async (ordonnanceData) => {
  try {
    const token = localStorage.getItem('token'); // Token d'auth uniquement
    
    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    // Préparer les données pour l'API
    const requestBody = {
      patientId: ordonnanceData.patientId || parseInt(patientId), // ID du patient
      dateValidite: ordonnanceData.dateValidite || null,
      note: ordonnanceData.observations || ordonnanceData.note || '',
      medicaments: ordonnanceData.medicaments.map(med => {
        // Si le médicament a un ID (existe déjà dans la BDD)
        if (med.medicamentId || med.id) {
          return {
            medicamentId: med.medicamentId || med.id,
            posologie: med.frequence || med.posologie,
            duree: med.duree || '',
            instructions: med.instructions || ''
          };
        } 
        // Si c'est un nouveau médicament
        else {
          return {
            medicamentData: {
              nom: med.nom,
              dosage: med.dosage,
              forme: med.forme || 'Comprimé',
              fabricant: med.fabricant || 'Non spécifié',
              moleculeMere: med.moleculeMere || med.nom,
              type: med.type || 'Autre',
              frequence: med.frequence || '1 fois par jour'
            },
            posologie: med.frequence || med.posologie,
            duree: med.duree || '',
            instructions: med.instructions || ''
          };
        }
      })
    };

    // Optionnel: lier à un rendez-vous
    if (ordonnanceData.rendezVousId) {
      requestBody.rendezVousId = ordonnanceData.rendezVousId;
    }

    console.log('Envoi ordonnance au serveur:', requestBody);

    // ✅ APPEL API vers le backend
    const response = await fetch(`${baseURL}/medecin/ordonnances`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Erreur lors de la création');
    }

    const data = await response.json();

    // Gérer les différentes réponses
    if (response.status === 202) {
      // Seulement des demandes créées (médicaments en attente de validation)
      alert(
        `Demandes de médicaments créées.\n` +
        `L'ordonnance sera créée après validation par l'admin.\n\n` +
        `${data.demandes?.length || 0} médicament(s) en attente de validation.`
      );
    } else if (response.status === 201) {
      // Ordonnance créée avec succès
      let message = 'Ordonnance créée avec succès!';
      
      if (data.demandesCreated && data.demandesCreated.length > 0) {
        message += `\n\nNote: ${data.demandesCreated.length} médicament(s) nécessitent une validation admin.`;
      }
      
      alert(message);
      
      // ✅ Recharger les données du patient pour afficher la nouvelle ordonnance
      // Option 1: Recharger toute la page
      window.location.reload();
      
      // OU Option 2: Re-fetch les données du patient
      // await fetchPatientData();
    }

    // Fermer le modal/form
    setShowOrdonnanceEditor(false);
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert(`Erreur: ${error.message}`);
  }
};
```

### Étape 3: Importer baseURL

Assurez-vous que `baseURL` est importé:

```jsx
import { baseURL } from '../config'; // ou votre chemin de config

// Dans config.js ou config.ts
export const baseURL = 'http://localhost:4000'; // ou votre URL de prod
```

### Étape 4: Vérifier le Token d'Authentification

Le token doit être stocké dans localStorage après la connexion:

```javascript
// Lors de la connexion (dans votre composant Login)
localStorage.setItem('token', responseData.accessToken);
// ou
localStorage.setItem('token', responseData.token);
```

---

## 🧪 Comment Tester

### Test 1: Vérifier l'Envoi au Serveur

1. Ouvrez DevTools (F12)
2. Allez dans l'onglet **Network**
3. Créez une ordonnance
4. Vous devriez voir une requête POST vers `/medecin/ordonnances`

**Requête attendue:**
```http
POST http://localhost:4000/medecin/ordonnances
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "patientId": 1,
  "dateValidite": "2024-12-01",
  "note": "Traitement de fond",
  "medicaments": [...]
}
```

**Réponse attendue (201):**
```json
{
  "message": "Ordonnance créée avec succès",
  "ordonnance": {
    "id": 1,
    "dateCreation": "2024-11-12T...",
    "medicaments": [...]
  }
}
```

### Test 2: Vérifier la Base de Données

Après création, vérifiez que l'ordonnance est dans la BDD:

```sql
-- Connectez-vous à PostgreSQL
SELECT * FROM "Ordonnance" ORDER BY "dateCreation" DESC LIMIT 5;

-- Vérifier les médicaments de l'ordonnance
SELECT 
  o.id as ordonnance_id,
  m.nom as medicament_nom,
  om.posologie,
  om.duree
FROM "Ordonnance" o
JOIN "OrdonnanceMedicament" om ON o.id = om."ordonnanceId"
JOIN "Medicament" m ON om."medicamentId" = m.id
WHERE o.id = 1; -- Remplacer par l'ID de votre ordonnance
```

### Test 3: Vérifier l'Affichage

Rechargez la page du profil patient et vérifiez que l'ordonnance apparaît.

---

## 🔍 Debugging

### Problème 1: "Invalid access token"

**Cause:** Le token n'est pas stocké ou est expiré.

**Solution:**
```javascript
// Vérifier le token
const token = localStorage.getItem('token');
console.log('Token:', token);

if (!token) {
  alert('Pas de token. Veuillez vous reconnecter.');
  // Rediriger vers login
  window.location.href = '/login';
}
```

### Problème 2: CORS Error

**Cause:** Le backend n'autorise pas les requêtes depuis le frontend.

**Solution:** Vérifier que le backend a configuré CORS:

```javascript
// Dans src/server.js
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000', // URL de votre frontend
  credentials: true
}));
```

### Problème 3: 400 Bad Request

**Cause:** Les données envoyées ne correspondent pas au format attendu.

**Solution:** Vérifier la console pour voir les données envoyées:

```javascript
console.log('Data sent:', JSON.stringify(requestBody, null, 2));
```

Vérifier que:
- `patientId` est un nombre
- `medicaments` est un tableau non vide
- Chaque médicament a soit `medicamentId` soit `medicamentData`

### Problème 4: 500 Internal Server Error

**Cause:** Erreur côté serveur.

**Solution:** Vérifier les logs serveur:

```bash
cd /home/user/webapp
tail -f server.log
```

---

## 📝 Code Complet d'Exemple

Voici un exemple complet de composant avec sauvegarde API:

```jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { baseURL } from '../config';
import OrdonnanceEditor from './OrdonnanceEditor';

function PatientProfile() {
  const { patientId } = useParams();
  const [showOrdonnanceEditor, setShowOrdonnanceEditor] = useState(false);
  const [patient, setPatient] = useState(null);

  const handleSaveOrdonnance = async (ordonnanceData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const requestBody = {
        patientId: parseInt(patientId),
        dateValidite: ordonnanceData.dateValidite || null,
        note: ordonnanceData.observations || '',
        medicaments: ordonnanceData.medicaments.map(med => ({
          medicamentId: med.medicamentId || med.id,
          posologie: med.frequence || '1 fois par jour',
          duree: med.duree || '1 mois',
          instructions: med.instructions || ''
        }))
      };

      console.log('Envoi au serveur:', requestBody);

      const response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const data = await response.json();

      if (response.status === 201) {
        alert('Ordonnance créée avec succès!');
        window.location.reload(); // Recharger pour afficher la nouvelle ordonnance
      }

      setShowOrdonnanceEditor(false);
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={() => setShowOrdonnanceEditor(true)}>
        Nouvelle Ordonnance
      </button>

      {showOrdonnanceEditor && patient && (
        <OrdonnanceEditor
          isOpen={showOrdonnanceEditor}
          onClose={() => setShowOrdonnanceEditor(false)}
          patient={patient}
          onSave={handleSaveOrdonnance}
        />
      )}
    </div>
  );
}

export default PatientProfile;
```

---

## ✅ Checklist de Vérification

Après avoir appliqué les corrections:

- [ ] Le code n'utilise plus `localStorage.setItem` pour les ordonnances
- [ ] Le code fait un `fetch()` vers `/medecin/ordonnances`
- [ ] Le token est envoyé dans le header `Authorization`
- [ ] Les données sont au bon format (voir exemple ci-dessus)
- [ ] La requête apparaît dans DevTools > Network
- [ ] La réponse du serveur est 201 Created
- [ ] L'ordonnance apparaît dans la base de données
- [ ] L'ordonnance s'affiche sur la page après rechargement

---

## 🎯 Résumé

**Avant:**
```javascript
localStorage.setItem('ordonnances', JSON.stringify(data)); // ❌
```

**Après:**
```javascript
await fetch(`${baseURL}/medecin/ordonnances`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(data)
}); // ✅
```

**Résultat:**
- ✅ Données sauvegardées dans PostgreSQL
- ✅ Accessibles depuis tous les appareils
- ✅ Sécurisées et persistantes
- ✅ Pas de perte de données si le cache est vidé

---

## 📞 Support

Si le problème persiste:

1. Vérifiez les logs serveur: `tail -f server.log`
2. Vérifiez Network tab dans DevTools
3. Vérifiez que le token est valide
4. Consultez `AUTOCOMPLETE_MEDICAMENTS_GUIDE.md` pour plus d'exemples

---

**Date:** 2024-11-12  
**Status:** Guide de correction disponible  
**Prochaine étape:** Modifier le code frontend pour utiliser l'API
