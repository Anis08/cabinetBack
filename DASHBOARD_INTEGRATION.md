# Dashboard Integration Guide

## Backend Endpoint Created ✅

### Endpoint: `GET /medecin/dashboard-kpis`
**Authentication**: Required (JWT Bearer Token)

### Response Structure:
```json
{
  "kpis": {
    "patientsToday": 12,
    "waiting": 3,
    "completed": 8,
    "revenue": 845,
    "trends": {
      "patientsDiff": "+2",
      "waitingTime": "15min",
      "completionRate": "67%",
      "revenueChange": "+12%"
    }
  }
}
```

## Frontend Integration - DashboardSimple.jsx

Replace your mock data with real API calls:

### Step 1: Add API call function at the top of component

```javascript
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Users, 
  Clock, 
  Euro, 
  TrendingUp,
  Activity,
  Calendar,
  MonitorPlay,
  ExternalLink
} from 'lucide-react'

const DashboardSimple = () => {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch KPIs on component mount
  useEffect(() => {
    fetchDashboardKPIs()
  }, [])

  const fetchDashboardKPIs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('http://localhost:4000/medecin/dashboard-kpis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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

### Step 2: Replace mockStats with dynamic data

```javascript
  // Replace mockKPIs with real data
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
```

### Step 3: Add loading and error states

```javascript
  // Add loading state before return
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

  // Add error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
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
```

### Step 4: Add auto-refresh (optional)

```javascript
  useEffect(() => {
    fetchDashboardKPIs()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardKPIs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
```

## Complete Updated Component

```javascript
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Users, 
  Clock, 
  Euro, 
  TrendingUp,
  Activity,
  Calendar,
  MonitorPlay,
  ExternalLink
} from 'lucide-react'

const DashboardSimple = () => {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchDashboardKPIs()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardKPIs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardKPIs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('http://localhost:4000/medecin/dashboard-kpis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setKpis(response.data.kpis)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard KPIs:', err)
      setError('Impossible de charger les données du tableau de bord')
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

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
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
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-blue-600" />
              Tableau de bord
            </h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de votre cabinet médical</p>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {mockStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className={`p-6 rounded-lg border ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs opacity-60 mt-1">{stat.trend}</p>
                </div>
                <div className="p-3 rounded-lg bg-white bg-opacity-50">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/home/patients')}
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Nouveau patient</span>
          </button>
          
          <button 
            onClick={() => navigate('/home/today-appointments')}
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Ajouter à la file</span>
          </button>
          
          <button 
            onClick={() => navigate('/home/calendar')}
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="font-medium">Planifier RDV</span>
          </button>
        </div>
      </motion.div>

      {/* Écran d'attente et Publicités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MonitorPlay className="h-5 w-5 mr-2 text-purple-600" />
          Écran d'Attente
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Affichez la file d'attente sur un écran dans votre salle d'attente et gérez les publicités
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={openWaitingLine}
            className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">Ouvrir l'Écran d'Attente</span>
          </button>
          
          <button
            onClick={goToAdsManagement}
            className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-md"
          >
            <MonitorPlay className="h-5 w-5" />
            <span className="font-medium">Gérer les Publicités</span>
          </button>
        </div>
      </motion.div>

      {/* Statut de l'application */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">Dashboard connecté !</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>✅ Données en temps réel chargées depuis le backend</p>
              <p>✅ Auto-refresh toutes les 30 secondes</p>
              <p>✅ KPIs: {kpis?.patientsToday} patients aujourd'hui, {kpis?.completed} terminés</p>
            </div>
            <div className="mt-3">
              <button 
                onClick={() => navigate('/home/patients')}
                className="text-green-800 hover:text-green-900 text-sm font-medium underline"
              >
                Voir tous les patients →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardSimple
```

## Testing Checklist

1. ✅ Backend endpoint `/medecin/dashboard-kpis` is created
2. ⏳ Replace DashboardSimple.jsx component with the code above
3. ⏳ Test loading state (should show spinner)
4. ⏳ Test with real data (should display actual KPIs)
5. ⏳ Test error handling (disconnect backend and check error message)
6. ⏳ Test auto-refresh (KPIs should update every 30 seconds)
7. ⏳ Test quick actions buttons (should navigate to correct pages)

## API Details

### Calculations:
- **patientsToday**: Total appointments today (all states)
- **waiting**: Appointments in 'Waiting' or 'InProgress' state
- **completed**: Appointments in 'Completed' state
- **revenue**: Price × number of paid completed appointments
- **patientsDiff**: Difference vs yesterday
- **waitingTime**: Average waiting time for completed appointments
- **completionRate**: Percentage of completed appointments
- **revenueChange**: Percentage change vs yesterday

### Auto-refresh:
The dashboard auto-refreshes every 30 seconds to show real-time updates.

### Error Handling:
- Network errors show retry button
- Invalid token redirects to login (handle in your auth interceptor)
- Server errors show user-friendly message
