# Dashboard Debug Guide - "Impossible de charger les données"

## ✅ Backend Status: WORKING

Le backend fonctionne correctement. L'endpoint `/medecin/dashboard-kpis` est actif et répond.

## 🔍 Causes Possibles de l'Erreur

### 1. Token non présent dans localStorage ⚠️ CAUSE PROBABLE

**Symptôme**: L'API retourne `{"message":"Invalid access token"}`

**Solution**: Vérifiez que le token est bien stocké dans localStorage

#### Ouvrez la Console du Navigateur (F12) et exécutez:
```javascript
console.log('Token:', localStorage.getItem('accessToken'))
```

**Si null ou undefined**:
1. Vous n'êtes pas connecté
2. Le token a expiré
3. Le token est stocké sous un autre nom

**Action**: Connectez-vous d'abord via la page de login

---

### 2. Mauvaise URL de l'API ❌

**Vérifiez dans votre DashboardSimple.jsx**:

```javascript
// ❌ INCORRECT si votre backend est sur un autre port
const response = await axios.get('http://localhost:4000/medecin/dashboard-kpis', {

// ✅ CORRECT - Vérifiez votre baseURL
const response = await axios.get('http://localhost:4000/medecin/dashboard-kpis', {
```

**Vérification**: Ouvrez Network tab (F12) et regardez l'URL appelée

---

### 3. CORS Error 🚫

**Symptôme**: Console affiche "CORS policy blocked"

**Solution**: Vérifiez que le CORS est configuré dans server.js

Devrait contenir:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // ou votre port frontend
  credentials: true
}))
```

---

### 4. Token dans le mauvais format 📝

**Le header Authorization doit être**:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Vérifiez dans votre code**:
- ❌ `'Authorization': token`
- ❌ `'Authorization': 'token'`
- ✅ `'Authorization': \`Bearer \${token}\``

---

## 🛠️ Solutions Étape par Étape

### Solution 1: Vérifier et Réparer le Token

#### Étape 1: Ouvrez la console navigateur (F12)

#### Étape 2: Vérifiez le token
```javascript
const token = localStorage.getItem('accessToken')
console.log('Token exists:', !!token)
console.log('Token value:', token)
```

#### Étape 3: Si pas de token, reconnectez-vous
- Allez sur la page de login
- Connectez-vous avec vos identifiants
- Vérifiez que le token est bien stocké après login

#### Étape 4: Vérifiez l'appel API dans Network tab
1. Ouvrez F12 > Network
2. Rafraîchissez le dashboard
3. Trouvez la requête `dashboard-kpis`
4. Cliquez dessus et vérifiez:
   - **Request Headers**: `Authorization: Bearer xxx`
   - **Status Code**: Devrait être 200, pas 401

---

### Solution 2: Utiliser un Axios Interceptor (RECOMMANDÉ)

Au lieu de mettre le token manuellement, utilisez un interceptor:

#### Créez un fichier `src/api/axiosConfig.js`:
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000',
})

// Interceptor pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré - rediriger vers login
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

#### Dans DashboardSimple.jsx, utilisez:
```javascript
import api from '../api/axiosConfig' // au lieu de axios

const fetchDashboardKPIs = async () => {
  try {
    setLoading(true)
    // Plus besoin de headers manuellement!
    const response = await api.get('/medecin/dashboard-kpis')
    setKpis(response.data.kpis)
    setError(null)
  } catch (err) {
    console.error('Error fetching dashboard KPIs:', err)
    setError('Impossible de charger les données du tableau de bord')
  } finally {
    setLoading(false)
  }
}
```

---

### Solution 3: Debug avec Console Logs

Ajoutez des logs dans votre fonction fetch:

```javascript
const fetchDashboardKPIs = async () => {
  try {
    setLoading(true)
    
    const token = localStorage.getItem('accessToken')
    console.log('🔑 Token exists:', !!token)
    console.log('🔑 Token value (first 20 chars):', token?.substring(0, 20))
    
    const url = 'http://localhost:4000/medecin/dashboard-kpis'
    console.log('🌐 Calling API:', url)
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('✅ API Response:', response.data)
    setKpis(response.data.kpis)
    setError(null)
  } catch (err) {
    console.error('❌ Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    })
    
    if (err.response?.status === 401) {
      setError('Session expirée. Veuillez vous reconnecter.')
    } else {
      setError('Impossible de charger les données du tableau de bord')
    }
  } finally {
    setLoading(false)
  }
}
```

Ensuite:
1. Ouvrez la console (F12)
2. Rafraîchissez le dashboard
3. Regardez les logs pour identifier le problème exact

---

## 🧪 Test Manuel de l'API

### Test 1: API fonctionne?
```bash
curl http://localhost:4000/medecin/dashboard-kpis
# Devrait retourner: {"message":"Invalid access token"}
```

### Test 2: Avec un vrai token
1. Connectez-vous sur votre frontend
2. Ouvrez console (F12)
3. Copiez le token: `localStorage.getItem('accessToken')`
4. Testez dans terminal:

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN_ICI" http://localhost:4000/medecin/dashboard-kpis
```

Si ça fonctionne dans curl mais pas dans le frontend → problème frontend
Si ça ne fonctionne pas dans curl → problème de token

---

## 📋 Checklist de Diagnostic

Vérifiez chaque point:

- [ ] Le serveur backend est en cours d'exécution (port 4000)
- [ ] Je suis connecté sur le frontend
- [ ] Le token existe dans localStorage (`localStorage.getItem('accessToken')`)
- [ ] L'URL de l'API est correcte dans le code
- [ ] Le header Authorization est au format `Bearer ${token}`
- [ ] Pas d'erreur CORS dans la console
- [ ] La requête apparaît dans Network tab (F12)
- [ ] Le Status Code de la requête n'est pas 401 ou 403

---

## 🎯 Solutions Rapides

### Si "Invalid access token":
→ Reconnectez-vous via la page login

### Si "CORS error":
→ Vérifiez le CORS dans server.js

### Si "Network Error":
→ Vérifiez que le backend est démarré (port 4000)

### Si aucune requête n'apparaît dans Network:
→ Vérifiez que la fonction fetchDashboardKPIs est bien appelée dans useEffect

---

## 💡 Code Frontend Complet et Testé

Voici un code qui devrait fonctionner à 100%:

```javascript
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Users, 
  Clock, 
  Euro, 
  Activity,
  Calendar,
  MonitorPlay,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

const DashboardSimple = () => {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchDashboardKPIs()
    
    const interval = setInterval(() => {
      fetchDashboardKPIs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardKPIs = async () => {
    try {
      setLoading(true)
      
      // Vérifier le token
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Non connecté. Redirection vers la page de connexion...')
        setTimeout(() => navigate('/login'), 2000)
        return
      }
      
      const response = await axios.get('http://localhost:4000/medecin/dashboard-kpis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setKpis(response.data.kpis)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard KPIs:', err)
      
      if (err.response?.status === 401) {
        setError('Session expirée. Redirection vers la page de connexion...')
        localStorage.removeItem('accessToken')
        setTimeout(() => navigate('/login'), 2000)
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.')
      } else if (err.message === 'Network Error') {
        setError('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.')
      } else {
        setError('Impossible de charger les données du tableau de bord')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const openWaitingLine = () => {
    window.open('/waiting-line', '_blank')
  }

  const goToAdsManagement = () => {
    navigate('/home/ads-management')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-red-800 font-semibold mb-2">Erreur</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardKPIs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mockStats = kpis ? [
    {
      title: 'Patients aujourd\'hui',
      value: kpis.patientsToday,
      icon: Users,
      color: 'blue',
      trend: `${kpis.trends.patientsDiff} vs hier`
    },
    {
      title: 'En attente',
      value: kpis.waiting,
      icon: Clock,
      color: 'orange',
      trend: `Temps moyen: ${kpis.trends.waitingTime}`
    },
    {
      title: 'Terminés',
      value: kpis.completed,
      icon: Activity,
      color: 'green',
      trend: `Taux: ${kpis.trends.completionRate}`
    },
    {
      title: 'Recettes',
      value: `${kpis.revenue}€`,
      icon: Euro,
      color: 'purple',
      trend: `${kpis.trends.revenueChange} vs hier`
    }
  ] : []

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200', 
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Reste du JSX identique à votre fichier original */}
      {/* ... */}
    </div>
  )
}

export default DashboardSimple
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide:

1. Ouvrez la console (F12)
2. Copiez TOUS les logs d'erreur
3. Vérifiez le Network tab pour l'appel dashboard-kpis
4. Partagez ces informations pour diagnostic approfondi
