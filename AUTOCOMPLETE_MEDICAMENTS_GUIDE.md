# 🔍 Guide d'Autocomplétion des Médicaments

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le système d'autocomplétion pour rechercher et sélectionner des médicaments lors de la création d'ordonnances.

---

## 🎯 Fonctionnalités

### ✅ Ce qui est déjà implémenté (Backend)

1. **Endpoint de recherche**: `GET /medecin/medicaments/search?q={terme}`
2. **Recherche intelligente**: Recherche dans le nom ET la molécule mère
3. **Recherche insensible à la casse**: "doliprane" = "DOLIPRANE" = "Doliprane"
4. **Limite de résultats**: Maximum 20 résultats pour ne pas surcharger l'interface
5. **Tri alphabétique**: Résultats triés par nom de médicament

### ✨ Composants Frontend Fournis

1. **MedicamentAutocomplete**: Composant React avec autocomplétion complète
2. **OrdonnanceEditor**: Exemple d'utilisation dans un éditeur d'ordonnance

---

## 🚀 Utilisation Rapide

### 1. Endpoint Backend

```http
GET /medecin/medicaments/search?q=dolip
Authorization: Bearer {votre_token}
```

**Réponse:**
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
      "frequence": "3 fois par jour"
    },
    {
      "id": 2,
      "nom": "Dolipranelib",
      "dosage": "500mg",
      "forme": "Gélule",
      "fabricant": "Sanofi",
      "moleculeMere": "Paracétamol",
      "type": "Antalgique",
      "frequence": "4 fois par jour"
    }
  ],
  "count": 2
}
```

### 2. Composant React

```jsx
import MedicamentAutocomplete from './MedicamentAutocomplete';

function MonComposant() {
  const handleSelect = (medicament) => {
    console.log('Médicament sélectionné:', medicament);
    // Ajouter le médicament à votre liste
  };

  return (
    <MedicamentAutocomplete
      onSelect={handleSelect}
      placeholder="Rechercher un médicament..."
    />
  );
}
```

---

## 📱 Interface Utilisateur

### Fonctionnalités de l'Autocomplete

#### 🎨 Design
- **Input avec icône de recherche**: Indication visuelle claire
- **Bouton de nettoyage (X)**: Efface le texte rapidement
- **Spinner de chargement**: Feedback visuel pendant la recherche
- **Dropdown avec scroll**: Liste scrollable jusqu'à 20 résultats
- **Highlight au survol**: Retour visuel sur l'élément survolé
- **Sélection au clavier**: Navigation avec ↑↓ et sélection avec Entrée

#### ⌨️ Raccourcis Clavier
- `↑` / `↓` : Naviguer dans les résultats
- `Enter` : Sélectionner le médicament en surbrillance
- `Escape` : Fermer le dropdown
- `Typing` : Recherche en temps réel (debounce 300ms)

#### 📊 Affichage des Résultats

Chaque médicament affiche:
- **Nom** (en gras)
- **Dosage** (badge violet)
- **Forme** (badge vert)
- **Type** (badge bleu)
- **Molécule mère** (si différente du nom)
- **Fabricant** (en petit)

---

## 🔧 Installation et Configuration

### Fichiers à Copier

1. **Composant Autocomplete**
   ```
   📁 src/components/
   └── MedicamentAutocomplete.jsx
   ```

2. **Composant OrdonnanceEditor (avec autocomplete)**
   ```
   📁 src/components/Ordonnances/
   └── OrdonnanceEditor.jsx
   ```

### Dépendances Requises

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

### Configuration Requise

Assurez-vous que `baseURL` est configuré:

```javascript
// config.js
export const baseURL = 'http://localhost:5000';
```

---

## 💡 Exemples d'Utilisation

### Exemple 1: Autocomplétion Simple

```jsx
import React, { useState } from 'react';
import MedicamentAutocomplete from './MedicamentAutocomplete';

function SimpleExample() {
  const [selectedMedicaments, setSelectedMedicaments] = useState([]);

  const handleSelect = (medicament) => {
    setSelectedMedicaments([...selectedMedicaments, medicament]);
  };

  return (
    <div>
      <h2>Rechercher un médicament</h2>
      <MedicamentAutocomplete onSelect={handleSelect} />
      
      <h3>Médicaments sélectionnés:</h3>
      <ul>
        {selectedMedicaments.map((med, idx) => (
          <li key={idx}>{med.nom} - {med.dosage}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Exemple 2: Dans un Formulaire d'Ordonnance

```jsx
import React, { useState } from 'react';
import MedicamentAutocomplete from './MedicamentAutocomplete';

function OrdonnanceForm({ patient }) {
  const [medicaments, setMedicaments] = useState([]);

  const handleAddMedicament = (medicament) => {
    const newMed = {
      ...medicament,
      frequence: '1 fois par jour',
      duree: '1 mois',
      instructions: ''
    };
    setMedicaments([...medicaments, newMed]);
  };

  const handleSubmit = async () => {
    const ordonnance = {
      patientId: patient.id,
      medicaments: medicaments.map(med => ({
        medicamentId: med.id,
        frequence: med.frequence,
        duree: med.duree,
        instructions: med.instructions
      }))
    };

    const response = await fetch('/medecin/ordonnances', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ordonnance)
    });

    if (response.ok) {
      alert('Ordonnance créée avec succès!');
    }
  };

  return (
    <div>
      <h2>Nouvelle Ordonnance pour {patient.fullName}</h2>
      
      <MedicamentAutocomplete
        onSelect={handleAddMedicament}
        placeholder="Rechercher un médicament..."
      />

      {medicaments.map((med, idx) => (
        <div key={idx} className="medicament-card">
          <h4>{med.nom} {med.dosage}</h4>
          <input
            type="text"
            value={med.frequence}
            onChange={(e) => {
              const updated = [...medicaments];
              updated[idx].frequence = e.target.value;
              setMedicaments(updated);
            }}
            placeholder="Fréquence"
          />
          <input
            type="text"
            value={med.duree}
            onChange={(e) => {
              const updated = [...medicaments];
              updated[idx].duree = e.target.value;
              setMedicaments(updated);
            }}
            placeholder="Durée"
          />
        </div>
      ))}

      <button onClick={handleSubmit}>
        Créer l'ordonnance
      </button>
    </div>
  );
}
```

### Exemple 3: Avec Gestion des Erreurs

```jsx
import React, { useState } from 'react';
import MedicamentAutocomplete from './MedicamentAutocomplete';
import { useAuth } from '../store/AuthProvider';

function AdvancedExample() {
  const [medicaments, setMedicaments] = useState([]);
  const [error, setError] = useState(null);
  const { logout, refresh } = useAuth();

  const handleSelect = (medicament) => {
    // Vérifier les doublons
    if (medicaments.find(m => m.id === medicament.id)) {
      setError('Ce médicament est déjà dans la liste');
      return;
    }

    setMedicaments([...medicaments, medicament]);
    setError(null);
  };

  const handleRemove = (index) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  return (
    <div>
      <MedicamentAutocomplete onSelect={handleSelect} />
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="medicaments-list">
        {medicaments.map((med, idx) => (
          <div key={idx} className="medicament-item">
            <span>{med.nom} - {med.dosage}</span>
            <button onClick={() => handleRemove(idx)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Personnalisation

### Modifier le Placeholder

```jsx
<MedicamentAutocomplete
  onSelect={handleSelect}
  placeholder="Tapez le nom d'un médicament (ex: Doliprane)"
/>
```

### Modifier le Debounce (délai de recherche)

Dans `MedicamentAutocomplete.jsx`, ligne ~70:

```javascript
// Changer 300 (ms) en ce que vous voulez
const timeoutId = setTimeout(searchMedicaments, 300);
```

### Modifier le Nombre Maximum de Résultats

Côté backend, dans `src/controllers/medicamentController.js`, ligne 102:

```javascript
take: 20, // Changer ce nombre
```

### Personnaliser les Styles

Le composant utilise Tailwind CSS. Vous pouvez modifier les classes dans `MedicamentAutocomplete.jsx`:

```jsx
// Changer la couleur de surbrillance
className={`
  ${index === selectedIndex 
    ? 'bg-blue-50 border-l-4 border-blue-500'  // ← Changer ici
    : 'hover:bg-gray-50'
  }
`}
```

---

## 🔍 Comment ça Marche

### 1. Flux de Recherche

```
Utilisateur tape "doli"
      ↓
Debounce 300ms (évite trop de requêtes)
      ↓
Requête API: GET /medecin/medicaments/search?q=doli
      ↓
Backend cherche dans:
  - nom LIKE '%doli%'
  - moleculeMere LIKE '%doli%'
      ↓
Retourne max 20 résultats triés
      ↓
Affichage dans le dropdown
```

### 2. Sélection

```
Utilisateur clique ou appuie sur Entrée
      ↓
Callback onSelect() appelé avec le médicament
      ↓
Parent component ajoute le médicament
      ↓
Input se réinitialise
```

### 3. Optimisations

- **Debounce**: Attendre 300ms après la dernière frappe
- **Limite de résultats**: Maximum 20 pour ne pas surcharger
- **Cache navigateur**: Les requêtes identiques sont mises en cache
- **Annulation de requêtes**: Les requêtes obsolètes sont annulées

---

## 🐛 Dépannage

### Problème 1: Aucun résultat ne s'affiche

**Solutions:**
1. Vérifiez que vous tapez au moins 2 caractères
2. Vérifiez le token dans localStorage
3. Ouvrez la console: devrait afficher les requêtes API
4. Vérifiez que le backend est démarré

### Problème 2: Erreur 401 Unauthorized

**Solution:**
```jsx
// Vérifiez que le token est correct
console.log('Token:', localStorage.getItem('token'));

// Implémentez le refresh de token
if (response.status === 401) {
  await refresh();
  // Retry la requête
}
```

### Problème 3: Le dropdown ne se ferme pas

**Solution:**
Le composant utilise `useRef` et écoute les clics en dehors. Vérifiez que:
- Le composant est bien monté
- Pas d'autres gestionnaires d'événements qui interfèrent
- Le `dropdownRef` est bien attaché à l'élément

### Problème 4: Les résultats sont lents

**Solutions:**
1. Augmenter le debounce (300ms → 500ms)
2. Réduire le nombre de résultats (20 → 10)
3. Optimiser la requête backend avec des index sur la BDD

---

## 📊 Performance

### Métriques

- **Temps de recherche**: < 100ms (base de données indexée)
- **Debounce**: 300ms (réglable)
- **Résultats max**: 20 (réglable)
- **Taille payload**: ~2-5 KB par recherche

### Optimisations Backend

Le backend utilise déjà:
- ✅ Index sur les colonnes `nom` et `moleculeMere`
- ✅ Recherche insensible à la casse avec Prisma
- ✅ Limite de résultats avec `take`
- ✅ Tri optimisé avec `orderBy`

---

## 🎯 Checklist d'Intégration

Avant de déployer:

- [ ] Composant `MedicamentAutocomplete.jsx` copié
- [ ] Composant `OrdonnanceEditor.jsx` mis à jour (optionnel)
- [ ] `baseURL` configuré correctement
- [ ] Token d'authentification fonctionne
- [ ] Test de recherche avec 2+ caractères
- [ ] Test de sélection avec souris
- [ ] Test de sélection avec clavier (↑↓ + Entrée)
- [ ] Test du bouton de nettoyage (X)
- [ ] Test de fermeture avec Escape
- [ ] Test de fermeture en cliquant en dehors
- [ ] Gestion des erreurs 401 (token expiré)
- [ ] Affichage correct sur mobile

---

## 📚 Ressources

### Fichiers du Projet

- `MedicamentAutocomplete.jsx` - Composant d'autocomplétion
- `OrdonnanceEditor_WITH_AUTOCOMPLETE.jsx` - Exemple d'utilisation
- `src/controllers/medicamentController.js` - Backend
- `src/routes/medicaments.js` - Routes API

### Documentation Associée

- `MEDICAMENTS_ORDONNANCES_GUIDE.md` - Guide complet du système
- `PATIENT_PROFILE_ORDONNANCES_INTEGRATION.md` - Intégration dans le profil patient

### API Endpoints

- `GET /medecin/medicaments/search?q={terme}` - Recherche autocomplete
- `GET /medecin/medicaments` - Liste complète
- `POST /medecin/ordonnances` - Créer une ordonnance

---

## 🚀 Prochaines Améliorations

### Fonctionnalités Futures

- [ ] Recherche par molécule mère uniquement
- [ ] Filtrage par type de médicament
- [ ] Recherche phonétique (dolipran → doliprane)
- [ ] Historique des recherches récentes
- [ ] Favoris médicaments
- [ ] Suggestions intelligentes basées sur l'historique
- [ ] Support multi-langue
- [ ] Voice search (recherche vocale)

---

**Dernière mise à jour**: 2024-11-12  
**Status**: ✅ Prêt à l'emploi  
**Backend**: ✅ Implémenté  
**Frontend**: ✅ Composants fournis
