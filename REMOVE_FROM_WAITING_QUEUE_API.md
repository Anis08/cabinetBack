# API : Supprimer un Patient de la File d'Attente

## 📋 Vue d'ensemble

Cette nouvelle fonctionnalité permet de **supprimer un patient de la file d'attente** en le marquant automatiquement comme ayant **terminé sa consultation**, sans avoir besoin de remplir tous les détails médicaux.

### Cas d'utilisation
- Patient qui quitte la file d'attente avant son tour
- Patient qui ne souhaite plus attendre
- Patient qui a déjà été vu rapidement (consultation express)
- Besoin de nettoyer la file d'attente rapidement

---

## 🆕 Nouvel Endpoint

### **POST** `/medecin/remove-from-waiting`

**Description** : Retire un patient de la file d'attente et marque son rendez-vous comme terminé

**Authentification** : Token JWT requis

---

## 📝 Détails de l'Endpoint

### Headers requis
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Body de la requête
```json
{
  "rendezVousId": 123
}
```

### Paramètres
| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `rendezVousId` | Integer | ✅ Oui | ID du rendez-vous à retirer de la file |

---

## ✅ Réponse Succès (200 OK)

```json
{
  "message": "Patient retiré de la file d'attente et marqué comme consultation terminée",
  "rendezVous": {
    "id": 123,
    "patientName": "Jean Dupont",
    "state": "Completed",
    "arrivalTime": "2024-11-12T14:30:00.000Z",
    "startTime": "2024-11-12T14:30:00.000Z",
    "endTime": "2024-11-12T15:45:00.000Z"
  }
}
```

### Champs de la réponse
| Champ | Type | Description |
|-------|------|-------------|
| `message` | String | Message de confirmation |
| `rendezVous.id` | Integer | ID du rendez-vous |
| `rendezVous.patientName` | String | Nom complet du patient |
| `rendezVous.state` | String | Nouvel état (toujours "Completed") |
| `rendezVous.arrivalTime` | DateTime | Heure d'arrivée du patient |
| `rendezVous.startTime` | DateTime | Heure de début (= arrivalTime si non défini) |
| `rendezVous.endTime` | DateTime | Heure de fin (= maintenant) |

---

## ❌ Réponses d'Erreur

### 400 - Bad Request (Champ manquant)
```json
{
  "message": "Le rendez-vous ID est requis"
}
```

### 400 - Bad Request (Mauvais état)
```json
{
  "message": "Le rendez-vous doit être en attente pour être supprimé de la file. État actuel: InProgress"
}
```

### 404 - Not Found
```json
{
  "message": "Rendez-vous non trouvé ou n'appartient pas à ce médecin"
}
```

### 500 - Internal Server Error
```json
{
  "message": "Erreur lors de la suppression de la file d'attente",
  "error": "Detailed error message"
}
```

---

## 🔒 Sécurité et Validations

### Vérifications effectuées
1. ✅ **Authentification** : Token JWT valide requis
2. ✅ **Autorisation** : Le rendez-vous doit appartenir au médecin authentifié
3. ✅ **État valide** : Le rendez-vous doit être en état `Waiting`
4. ✅ **Mise à jour WebSocket** : La file d'attente publique est mise à jour en temps réel

### États de rendez-vous
| État | Description | Peut être supprimé ? |
|------|-------------|---------------------|
| `Scheduled` | Rendez-vous programmé | ❌ Non |
| `Waiting` | Dans la file d'attente | ✅ **Oui** |
| `InProgress` | En cours de consultation | ❌ Non |
| `Completed` | Consultation terminée | ❌ Non |
| `Cancelled` | Rendez-vous annulé | ❌ Non |

---

## 🔄 Différences avec les autres endpoints

### Comparaison des fonctions

| Fonction | Endpoint | État initial requis | État final | Détails médicaux requis |
|----------|----------|---------------------|------------|------------------------|
| **removeFromWaitingQueue** | `/remove-from-waiting` | `Waiting` | `Completed` | ❌ Non |
| **finishConsultation** | `/finish-consultation` | `InProgress` | `Completed` | ✅ Oui (paye, note, poids, etc.) |
| **addToInProgress** | `/add-to-actif` | `Waiting` | `InProgress` | ❌ Non |
| **returnToQueue** | `/return-queue` | `InProgress` | `Waiting` | ❌ Non |

### Quand utiliser chaque fonction ?

**`removeFromWaitingQueue`** ✨ (NOUVEAU)
- Patient quitte la file avant d'être vu
- Nettoyage rapide de la file d'attente
- Pas besoin de saisir les détails médicaux

**`finishConsultation`**
- Patient a été vu et la consultation est complète
- Tous les détails médicaux sont disponibles (paiement, notes, signes vitaux)

**`addToInProgress`**
- Patient entre en consultation
- Commence le compteur de temps de consultation

**`returnToQueue`**
- Patient retourne dans la file d'attente
- Consultation interrompue ou reportée

---

## 🧪 Tests avec cURL

### Test de base
```bash
curl -X POST \
  http://localhost:3000/medecin/remove-from-waiting \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendezVousId": 123
  }'
```

### Test avec un rendez-vous invalide (doit échouer)
```bash
curl -X POST \
  http://localhost:3000/medecin/remove-from-waiting \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendezVousId": 99999
  }'
```

---

## 💻 Intégration Frontend

### Exemple React/JavaScript

```javascript
const removeFromWaitingQueue = async (rendezVousId) => {
  try {
    const response = await fetch('http://localhost:3000/medecin/remove-from-waiting', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rendezVousId })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Patient retiré:', data.message);
      console.log('Patient:', data.rendezVous.patientName);
      
      // Mettre à jour l'interface
      refreshWaitingList();
      
      // Afficher une notification
      showNotification('success', data.message);
    } else {
      console.error('❌ Erreur:', data.message);
      showNotification('error', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    showNotification('error', 'Erreur de connexion au serveur');
  }
};

// Utilisation
removeFromWaitingQueue(123);
```

### Exemple avec Axios

```javascript
import axios from 'axios';

const removeFromWaitingQueue = async (rendezVousId) => {
  try {
    const { data } = await axios.post(
      '/medecin/remove-from-waiting',
      { rendezVousId },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );

    console.log('✅', data.message);
    return data.rendezVous;
  } catch (error) {
    if (error.response) {
      // Erreur retournée par le serveur
      console.error('❌', error.response.data.message);
      throw new Error(error.response.data.message);
    } else {
      // Erreur réseau
      console.error('❌ Erreur réseau:', error.message);
      throw new Error('Erreur de connexion au serveur');
    }
  }
};
```

### Composant React Complet

```jsx
import React, { useState } from 'react';
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const WaitingQueueItem = ({ rendezVous, onRemove }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/medecin/remove-from-waiting', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rendezVousId: rendezVous.id })
      });

      const data = await response.json();

      if (response.ok) {
        // Notification de succès
        alert(`✅ ${data.message}`);
        
        // Callback pour mettre à jour la liste
        onRemove(rendezVous.id);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="font-semibold">{rendezVous.patient.fullName}</h3>
        <p className="text-sm text-gray-600">
          Arrivé à {new Date(rendezVous.arrivalTime).toLocaleTimeString()}
        </p>
      </div>

      <div className="flex gap-2">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
            disabled={loading}
          >
            <Trash2 size={16} />
            Retirer
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={loading}
            >
              <CheckCircle size={16} />
              {loading ? 'En cours...' : 'Confirmer'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingQueueItem;
```

---

## 🔔 Mise à Jour WebSocket

La fonction déclenche automatiquement une mise à jour WebSocket via `triggerWaitingLineUpdate()`.

### Événement déclenché
```javascript
// WebSocket event
{
  type: 'waiting_line_update',
  timestamp: '2024-11-12T15:45:00.000Z'
}
```

### Écouter l'événement côté client
```javascript
// Connexion WebSocket
const socket = io('http://localhost:3000');

socket.on('waiting_line_update', () => {
  console.log('📢 File d\'attente mise à jour !');
  // Recharger la liste de la file d'attente
  fetchWaitingList();
});
```

---

## 📊 Impact sur la Base de Données

### Changements effectués

```sql
-- Avant
SELECT id, state, arrivalTime, startTime, endTime 
FROM RendezVous 
WHERE id = 123;

-- Résultat avant
id  | state   | arrivalTime         | startTime | endTime
123 | Waiting | 2024-11-12 14:30:00 | NULL      | NULL

-- Après appel de l'API
-- Résultat après
id  | state     | arrivalTime         | startTime           | endTime
123 | Completed | 2024-11-12 14:30:00 | 2024-11-12 14:30:00 | 2024-11-12 15:45:00
```

### Champs modifiés
- `state` : `Waiting` → `Completed`
- `endTime` : `NULL` → Timestamp actuel
- `startTime` : Si `NULL`, défini sur `arrivalTime` ou timestamp actuel

---

## 📋 Checklist d'Intégration

- [x] Fonction `removeFromWaitingQueue` créée dans le contrôleur
- [x] Route `/medecin/remove-from-waiting` ajoutée
- [x] Authentification JWT activée
- [x] Validation de l'état du rendez-vous
- [x] Mise à jour WebSocket implémentée
- [x] Messages d'erreur en français
- [x] Documentation complète créée

### Configuration Frontend
- [ ] Ajouter un bouton "Retirer de la file" dans l'interface de la file d'attente
- [ ] Implémenter la confirmation avant suppression
- [ ] Afficher une notification de succès/erreur
- [ ] Mettre à jour la liste après suppression
- [ ] Écouter les événements WebSocket pour synchronisation

---

## 🎯 Exemples d'Utilisation

### Scénario 1 : Patient quitte la file
```javascript
// Patient décide de partir avant son tour
const patientId = 123;
await removeFromWaitingQueue(patientId);
// ✅ Patient retiré, file d'attente mise à jour
```

### Scénario 2 : Nettoyage de fin de journée
```javascript
// Retirer tous les patients encore en attente
const waitingPatients = await getWaitingList();

for (const patient of waitingPatients) {
  await removeFromWaitingQueue(patient.rendezVousId);
  await delay(100); // Petit délai entre chaque suppression
}
// ✅ Tous les patients retirés
```

### Scénario 3 : Gestion d'erreur
```javascript
try {
  await removeFromWaitingQueue(invalidId);
} catch (error) {
  if (error.message.includes('État actuel')) {
    console.log('⚠️ Le patient n\'est plus en attente');
    // Rafraîchir la liste
    fetchWaitingList();
  }
}
```

---

## 📚 Documentation Connexe

- **Schema Prisma** : `/prisma/schema.prisma` - Modèle `RendezVous`
- **Contrôleur** : `/src/controllers/medecinController.js` - Fonction `removeFromWaitingQueue`
- **Routes** : `/src/routes/medecin.js` - Route `/remove-from-waiting`
- **WebSocket** : `/src/services/websocketService.js` - Service de mise à jour en temps réel

---

## 🚀 Déploiement

Aucune migration de base de données n'est requise ! Cette fonctionnalité utilise les champs existants du modèle `RendezVous`.

### Redémarrer le serveur
```bash
npm run dev
```

### Vérifier que l'endpoint fonctionne
```bash
curl http://localhost:3000/medecin/remove-from-waiting
# Devrait retourner 401 (pas authentifié) ou 404 (route trouvée)
```

---

## ✅ Résumé

**Nouvel endpoint** : `POST /medecin/remove-from-waiting`

**Fonctionnalité** :
- ✅ Retire un patient de la file d'attente (`Waiting`)
- ✅ Marque automatiquement comme `Completed`
- ✅ Pas besoin de détails médicaux
- ✅ Mise à jour WebSocket automatique
- ✅ Validation stricte de l'état
- ✅ Messages en français
- ✅ Gestion d'erreurs robuste

**Cas d'usage** :
- Patient qui quitte avant consultation
- Nettoyage rapide de la file
- Consultation express sans détails

**Prêt à l'emploi** ! 🎉

---

**Date de création** : 12 novembre 2024  
**Auteur** : GenSpark AI Developer
