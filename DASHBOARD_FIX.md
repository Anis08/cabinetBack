# Dashboard Fix - Token Key Issue

## 🎯 Problème Identifié

Dans votre `DashboardSimple.jsx`, ligne 33:
```javascript
const token = localStorage.getItem('token')
```

## ✅ Solution

### Étape 1: Vérifier le nom de la clé du token

Ouvrez la console de votre navigateur (F12) et exécutez:

```javascript
// Vérifiez tous les tokens possibles
console.log('token:', localStorage.getItem('token'))
console.log('accessToken:', localStorage.getItem('accessToken'))
console.log('auth_token:', localStorage.getItem('auth_token'))

// Voir toutes les clés
console.log('All localStorage keys:', Object.keys(localStorage))
```

### Étape 2: Utilisez la bonne clé

Regardez dans votre code de **login** pour voir comment vous stockez le token.

#### Si dans votre login vous avez:
```javascript
localStorage.setItem('accessToken', response.data.accessToken)
```

#### Alors changez dans DashboardSimple.jsx:
```javascript
// Ligne 33
const token = localStorage.getItem('accessToken')  // ← Changez 'token' en 'accessToken'
```

### Étape 3: Code Corrigé

Remplacez la fonction `fetchDashboardKPIs` par:

```javascript
const fetchDashboardKPIs = async () => {
  try {
    setLoading(true)
    
    // ESSAYEZ LES DEUX NOMS POSSIBLES
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    
    console.log('🔑 Token found:', !!token) // Debug
    
    if (!token) {
      setError('Non connecté. Veuillez vous reconnecter.')
      return
    }
    
    const response = await fetch(`${baseURL}/medecin/dashboard-kpis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    console.log('📡 Response status:', response.status) // Debug

    if (!response.ok) {
      if (response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        // Optionnel: rediriger vers login
        // setTimeout(() => navigate('/login'), 2000)
        return
      }
      throw new Error('Erreur lors de la récupération des KPIs')
    }

    const data = await response.json()
    console.log('✅ KPIs received:', data.kpis) // Debug
    
    setKpis(data.kpis)
    setError(null)
    setLastRefresh(new Date())
  } catch (err) {
    console.error('❌ Error fetching dashboard KPIs:', err)
    setError('Impossible de charger les données du tableau de bord')
  } finally {
    setLoading(false)
  }
}
```

## 🧪 Test Rapide

### Dans la console du navigateur (F12):

```javascript
// 1. Vérifier le token
const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
console.log('Token exists:', !!token)
console.log('Token preview:', token?.substring(0, 30))

// 2. Tester l'API manuellement
fetch('http://localhost:4000/medecin/dashboard-kpis', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err))
```

## 📋 Checklist

- [ ] Vérifier le nom de la clé dans localStorage (token vs accessToken)
- [ ] Ajouter les console.log pour débugger
- [ ] Vérifier dans Network tab (F12) que le header Authorization est envoyé
- [ ] Vérifier que baseURL est correct (probablement http://localhost:4000)
- [ ] Tester l'API manuellement dans la console

## 🎯 Solution Alternative: Chercher Automatiquement

Si vous ne voulez pas chercher, utilisez ce code qui essaie tous les noms possibles:

```javascript
const getAuthToken = () => {
  // Essayer tous les noms possibles
  const possibleKeys = ['accessToken', 'token', 'auth_token', 'authToken', 'jwt']
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key)
    if (token) {
      console.log(`🔑 Token found in localStorage.${key}`)
      return token
    }
  }
  
  console.error('❌ No token found in localStorage')
  return null
}

// Dans fetchDashboardKPIs:
const token = getAuthToken()
if (!token) {
  setError('Non connecté. Veuillez vous reconnecter.')
  return
}
```

## 🚀 Code Complet Recommandé

```javascript
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { baseURL } from '../config'
import { 
  Users, 
  Clock, 
  Euro, 
  TrendingUp,
  Activity,
  Calendar,
  MonitorPlay,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

const DashboardSimple = () => {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
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
      
      // ✅ CORRIGÉ: Essayer les deux noms possibles
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      // Debug
      console.log('🔑 Token found:', !!token)
      
      if (!token) {
        setError('Non connecté. Veuillez vous reconnecter.')
        setLoading(false)
        return
      }
      
      const response = await fetch(`${baseURL}/medecin/dashboard-kpis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ KPIs received:', data.kpis)
      
      setKpis(data.kpis)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('❌ Error fetching dashboard KPIs:', err)
      setError('Impossible de charger les données du tableau de bord')
    } finally {
      setLoading(false)
    }
  }
  
  // ... rest of your component code stays the same
}

export default DashboardSimple
```

## 🎓 Pourquoi ce problème?

Le nom de la clé dans `localStorage` doit correspondre **exactement** à celui utilisé lors du login:

- Si login utilise: `localStorage.setItem('accessToken', ...)`
- Dashboard doit utiliser: `localStorage.getItem('accessToken')`

**Une différence d'un seul caractère et ça ne marchera pas!**
