# Dashboard Backend Connection Guide

## ✅ Backend Status: RUNNING

Le serveur backend est actif sur le port 4000 et répond correctement.

## 🔍 Problème Probable

Votre code frontend affiche: **"⚠️ Backend non connecté - Données mockées affichées"**

Cela signifie que la requête fetch échoue. Voici les causes possibles:

### 1. **baseURL incorrect** ❌

**Vérifiez votre fichier `config.js`**:

```javascript
// config.js
export const baseURL = 'http://localhost:4000'  // ✅ CORRECT

// ❌ INCORRECT:
// export const baseURL = 'http://localhost:5000'
// export const baseURL = 'http://localhost:3000'
// export const baseURL = '/api'
```

### 2. **CORS non configuré** 🚫

Le backend doit autoriser les requêtes depuis votre frontend.

**Vérifiez dans `src/server.js`:**

```javascript
import cors from 'cors'

app.use(cors({
  origin: 'http://localhost:3000',  // Port de votre frontend React
  credentials: true
}))
```

### 3. **Token non présent** 🔑

Le token doit exister dans localStorage.

**Test dans la console navigateur (F12):**

```javascript
console.log('Token:', localStorage.getItem('accessToken'))
// Devrait afficher un long string JWT, pas null
```

## 🛠️ Solutions

### Solution 1: Vérifier et Corriger baseURL

#### Créez ou modifiez `src/config.js`:

```javascript
// src/config.js
export const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000'
```

#### Vérifiez que votre DashboardSimple.jsx importe correctement:

```javascript
import { baseURL } from '../config'
```

#### Test dans la console:

```javascript
import { baseURL } from './config'
console.log('baseURL:', baseURL)
// Devrait afficher: http://localhost:4000
```

---

### Solution 2: Activer CORS dans le Backend

Le backend DOIT autoriser les requêtes cross-origin.

#### Vérifiez `src/server.js`:

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

// CORS Configuration - DOIT être AVANT les routes
app.use(cors({
  origin: 'http://localhost:3000',  // Port de votre frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// ... vos routes
```

#### Si vous utilisez un port différent pour le frontend:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],  // Vite utilise 5173
  credentials: true
}))
```

---

### Solution 3: Améliorer le Code Frontend avec Meilleure Gestion d'Erreurs

Remplacez votre fonction `fetchDashboardKPIs` par celle-ci:

```javascript
const fetchDashboardKPIs = async () => {
  try {
    setLoading(true)
    
    // 1. Vérifier le token
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      console.error('❌ No token found in localStorage')
      setError('⚠️ Non connecté - Veuillez vous reconnecter')
      // Fallback to mock data
      setKpis({
        patientsToday: 0,
        waiting: 0,
        completed: 0,
        revenue: 0,
        trends: {
          patientsDiff: '+0',
          waitingTime: 'N/A',
          completionRate: '0%',
          revenueChange: '+0%'
        }
      })
      return
    }
    
    // 2. Log de debug
    console.log('🔄 Fetching dashboard KPIs from:', `${baseURL}/medecin/dashboard-kpis`)
    console.log('🔑 Token exists:', !!token)
    
    // 3. Appel API
    const response = await fetch(`${baseURL}/medecin/dashboard-kpis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    console.log('📡 Response status:', response.status)

    // 4. Vérifier la réponse
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ API Error:', errorData)
      
      if (response.status === 401) {
        throw new Error('Session expirée')
      }
      throw new Error(errorData.message || 'Erreur API')
    }

    // 5. Parser les données
    const data = await response.json()
    console.log('✅ KPIs received:', data.kpis)
    
    setKpis(data.kpis)
    setError(null)  // Clear error on success
    setLastRefresh(new Date())
    
  } catch (err) {
    console.error('❌ Error fetching dashboard KPIs:', err)
    
    // Messages d'erreur spécifiques
    let errorMessage = '⚠️ Backend non connecté - Données mockées affichées'
    
    if (err.message === 'Session expirée') {
      errorMessage = '⚠️ Session expirée - Veuillez vous reconnecter'
    } else if (err.message === 'Failed to fetch') {
      errorMessage = '⚠️ Backend inaccessible (vérifiez que le serveur est démarré)'
    }
    
    setError(errorMessage)
    
    // Fallback to mock data
    console.warn('Using mock data as fallback')
    setKpis({
      patientsToday: 12,
      waiting: 3,
      completed: 8,
      revenue: 845,
      trends: {
        patientsDiff: '+2',
        waitingTime: '15min',
        completionRate: '67%',
        revenueChange: '+12%'
      }
    })
    setLastRefresh(new Date())
  } finally {
    setLoading(false)
  }
}
```

---

### Solution 4: Test Complet dans la Console

Ouvrez la console de votre navigateur (F12) et exécutez:

```javascript
// Test 1: Vérifier le token
const token = localStorage.getItem('accessToken')
console.log('1. Token exists:', !!token)
console.log('   Token preview:', token?.substring(0, 30))

// Test 2: Vérifier baseURL (remplacez par votre vraie valeur)
const baseURL = 'http://localhost:4000'
console.log('2. baseURL:', baseURL)

// Test 3: Tester l'API manuellement
fetch(`${baseURL}/medecin/dashboard-kpis`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(res => {
  console.log('3. Response status:', res.status)
  return res.json()
})
.then(data => {
  console.log('4. ✅ Data received:', data)
})
.catch(err => {
  console.error('5. ❌ Error:', err)
})
```

**Résultats attendus:**
- Test 1: `Token exists: true`
- Test 2: `baseURL: http://localhost:4000`
- Test 3: `Response status: 200`
- Test 4: `Data received: { kpis: {...} }`

**Si erreur:**
- `Failed to fetch` → Problème CORS ou backend pas démarré
- `401 Unauthorized` → Token invalide ou expiré
- `404 Not Found` → Mauvaise URL

---

## 🚀 Checklist de Connexion

Suivez cette checklist dans l'ordre:

- [ ] 1. **Backend démarré**: `ps aux | grep node` montre le processus
- [ ] 2. **Port correct**: Backend sur port 4000
- [ ] 3. **CORS configuré**: `cors()` dans server.js avec bon origin
- [ ] 4. **baseURL correct**: `config.js` pointe vers `http://localhost:4000`
- [ ] 5. **Token existe**: `localStorage.getItem('accessToken')` retourne une valeur
- [ ] 6. **Test API console**: Exécuter le test complet ci-dessus
- [ ] 7. **Network tab**: F12 > Network, voir la requête `dashboard-kpis`
- [ ] 8. **Console logs**: Voir les logs de debug (`🔄`, `✅`, `❌`)

---

## 🎯 Si Toujours Pas de Connexion

### Test Direct du Backend

Dans votre terminal:

```bash
# Test 1: Backend répond-il?
curl http://localhost:4000/

# Test 2: Endpoint dashboard existe?
curl http://localhost:4000/medecin/dashboard-kpis

# Devrait retourner: {"message":"Authorization header missing or malformed"}
# C'est NORMAL - ça prouve que l'endpoint existe
```

### Vérifier les Logs Backend

```bash
cd /home/user/webapp
tail -f server.log
```

Puis rafraîchissez le dashboard frontend. Vous devriez voir les logs de la requête.

---

## 📋 Configuration Recommandée

### 1. Frontend `src/config.js`:

```javascript
export const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000'
```

### 2. Backend `src/server.js`:

```javascript
import cors from 'cors'

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
// ... rest of server config
```

### 3. Frontend `DashboardSimple.jsx`:

```javascript
const fetchDashboardKPIs = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('No token')
    
    const response = await fetch(`${baseURL}/medecin/dashboard-kpis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    setKpis(data.kpis)
    setError(null)
  } catch (err) {
    console.error('Dashboard API error:', err)
    setError('Backend non accessible')
    // Fallback to mock data...
  }
}
```

---

## 💡 Astuce Pro: Voir Toutes les Requêtes

Dans votre navigateur:

1. Ouvrez DevTools (F12)
2. Onglet **Network**
3. Cochez **Preserve log**
4. Rafraîchissez le dashboard
5. Cherchez la ligne `dashboard-kpis`
6. Cliquez dessus pour voir:
   - Request URL
   - Request Headers (surtout Authorization)
   - Response Status
   - Response Body

---

## 📞 Aide Supplémentaire

Si ça ne fonctionne toujours pas, partagez:

1. **Console logs** (F12 > Console) - Tous les messages
2. **Network tab** - Screenshot de la requête dashboard-kpis
3. **Config.js** - Votre fichier complet
4. **Server.js CORS** - Votre configuration CORS

Je pourrai alors diagnostiquer le problème exact! 🔍
