// Updated HistorySimple Component
// This version works with the backend API endpoints

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  Search,
  Filter,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Heart,
  Droplet,
  Activity,
  FileText,
  Thermometer,
  Weight,
  Ruler,
  Wind,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope,
  Pill,
  ClipboardList
} from 'lucide-react'
import { baseURL } from "../config"
import { useAuth } from '../store/AuthProvider'
import { useData } from '../store/DataProvider'

// Constantes pour les valeurs normales
const VITAL_SIGNS_NORMALS = {
  bloodPressureSystolic: { min: 90, max: 140, unit: 'mmHg', label: 'Pression systolique' },
  bloodPressureDiastolic: { min: 60, max: 90, unit: 'mmHg', label: 'Pression diastolique' },
  heartRate: { min: 60, max: 100, unit: 'bpm', label: 'Rythme cardiaque' },
  temperature: { min: 36.1, max: 37.8, unit: '°C', label: 'Température' },
  oxygenSaturation: { min: 95, max: 100, unit: '%', label: 'Saturation O₂' },
  respiratoryRate: { min: 12, max: 20, unit: '/min', label: 'Fréquence respiratoire' },
  weight: { min: 40, max: 150, unit: 'kg', label: 'Poids' },
  height: { min: 140, max: 220, unit: 'cm', label: 'Taille' },
  bmi: { min: 18.5, max: 25, unit: 'kg/m²', label: 'IMC' },
  pcm: { min: 36.1, max: 37.8, unit: '°C', label: 'Température' }
}

// Fonction pour vérifier si une valeur est normale
const checkVitalSignStatus = (key, value) => {
  if (!value || !VITAL_SIGNS_NORMALS[key]) return 'unknown'
  const { min, max } = VITAL_SIGNS_NORMALS[key]
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return 'unknown'
  
  if (numValue < min) return 'low'
  if (numValue > max) return 'high'
  return 'normal'
}

// Composant pour afficher une constante vitale
const VitalSignCard = ({ icon: Icon, label, value, unit, status, delay }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'high': return 'border-red-300 bg-red-50'
      case 'low': return 'border-yellow-300 bg-yellow-50'
      case 'normal': return 'border-green-300 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'low': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${getStatusColor()}`}
    >
      <Icon className="h-5 w-5 text-gray-600" />
      <div className="flex-1">
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          {value} {unit}
        </p>
      </div>
      {getStatusIcon()}
    </motion.div>
  )
}

// Composant pour afficher une donnée biologique
const BiologicalTestCard = ({ test, status, date, result, delay }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'demandée':
        return {
          icon: ClipboardList,
          color: 'bg-blue-50 border-blue-300 text-blue-700',
          iconColor: 'text-blue-500'
        }
      case 'en attente':
        return {
          icon: Clock,
          color: 'bg-yellow-50 border-yellow-300 text-yellow-700',
          iconColor: 'text-yellow-500'
        }
      case 'reçue':
        return {
          icon: CheckCircle,
          color: 'bg-green-50 border-green-300 text-green-700',
          iconColor: 'text-green-500'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'bg-gray-50 border-gray-300 text-gray-700',
          iconColor: 'text-gray-500'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`flex items-start justify-between p-3 rounded-lg border-2 ${config.color}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.iconColor}`} />
        <div>
          <p className="text-sm font-semibold">{test}</p>
          <p className="text-xs opacity-75 mt-0.5">
            {status === 'demandée' ? 'Prescrit' : status === 'en attente' ? 'En cours' : 'Résultat disponible'}
          </p>
          {date && (
            <p className="text-xs opacity-75 mt-1">
              📅 {new Date(date).toLocaleDateString('fr-FR')}
            </p>
          )}
          {result && status === 'reçue' && (
            <p className="text-xs font-medium mt-1">
              📊 Résultat: {result}
            </p>
          )}
        </div>
      </div>
      {status === 'reçue' && (
        <button className="p-1 hover:bg-green-100 rounded transition-colors">
          <Download className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}

// Composant principal
const HistorySimple = () => {
  const { completedAppointments, setCompletedAppointments, setAveragePaid, setCaDay, setCaWeek } = useData()
  const { logout, refresh } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [expandedConsultations, setExpandedConsultations] = useState({})
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Charger les données depuis l'API
  useEffect(() => {
    loadHistoryData()
  }, []) // Load once on component mount

  const loadHistoryData = async () => {
    setLoading(true)
    try {
      let response = await fetch(`${baseURL}/medecin/completed-appointments-grouped`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 403) {
          logout()
          return
        }
        if (response.status === 401) {
          const refreshResponse = await refresh()
          if (!refreshResponse) {
            logout()
            return
          }

          response = await fetch(`${baseURL}/medecin/completed-appointments-grouped`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          })
        }

        if (!response.ok) {
          console.log('API error, setting empty state')
          setCompletedAppointments([])
          setLoading(false)
          return
        }
      }

      const data = await response.json()
      
      // Data comes grouped by date: { "2025-11-09": [...], "2025-11-08": [...] }
      // Convert to flat array with date field for easier filtering
      const groupedAppointments = data.completedApointments || {}
      const appointmentsArray = []
      
      Object.keys(groupedAppointments).forEach(dateKey => {
        groupedAppointments[dateKey].forEach(apt => {
          appointmentsArray.push({
            ...apt,
            date: dateKey, // Ensure date is in YYYY-MM-DD format
            motif: apt.motif || 'Consultation',
            // Ensure biologicalTests is an array
            biologicalTests: apt.biologicalTests || [],
            // Ensure documents is an array
            documents: apt.documents || []
          })
        })
      })
      
      setCompletedAppointments(appointmentsArray)
      if (data.averagePaid !== undefined) setAveragePaid(data.averagePaid)
      if (data.todayRevenue !== undefined) setCaDay(data.todayRevenue)
      if (data.weekRevenue !== undefined) setCaWeek(data.weekRevenue)
    } catch (error) {
      console.error('Error loading history:', error)
      setCompletedAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les consultations par date
  const getConsultationsForDate = (date) => {
    if (!completedAppointments || !Array.isArray(completedAppointments)) return []
    
    const dateStr = date.toISOString().split('T')[0]
    return completedAppointments.filter(apt => {
      // Handle both formats: "2025-11-09" and "2025-11-09T00:00:00.000Z"
      const aptDateStr = typeof apt.date === 'string' && apt.date.includes('T')
        ? apt.date.split('T')[0]
        : apt.date
      return aptDateStr === dateStr
    })
  }

  // Obtenir les consultations du jour actuel
  const todayConsultations = getConsultationsForDate(currentDate)

  // Calculer les statistiques du jour
  const calculateDayStats = () => {
    const consultations = todayConsultations
    const totalVitalSigns = consultations.filter(c => c.vitalSigns).length
    const totalBiologicalTests = consultations.reduce((sum, c) => 
      sum + (Array.isArray(c.biologicalTests) ? c.biologicalTests.length : 0), 0
    )
    const testsRequested = consultations.reduce((sum, c) => 
      sum + (Array.isArray(c.biologicalTests) ? c.biologicalTests.filter(t => t.status === 'demandée').length : 0), 0
    )
    const testsReceived = consultations.reduce((sum, c) => 
      sum + (Array.isArray(c.biologicalTests) ? c.biologicalTests.filter(t => t.status === 'reçue').length : 0), 0
    )

    return {
      totalConsultations: consultations.length,
      totalVitalSigns,
      totalBiologicalTests,
      testsRequested,
      testsReceived
    }
  }

  const stats = calculateDayStats()

  // Navigation de dates
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Toggle détails consultation
  const toggleConsultationDetails = (id) => {
    setExpandedConsultations(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
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
              <History className="h-6 w-6 mr-2 text-blue-600" />
              Historique Clinique
            </h1>
            <p className="text-gray-600 mt-1">
              Vue complète des consultations avec constantes vitales et bilans biologiques
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation de dates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Jour précédent"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {currentDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.totalConsultations} consultation{stats.totalConsultations > 1 ? 's' : ''} ce jour
                </p>
              </div>
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Jour suivant"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Aujourd'hui</span>
          </button>
        </div>
      </motion.div>

      {/* Statistiques du jour */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Consultations</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalConsultations}</p>
            </div>
            <Stethoscope className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Constantes vitales</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalVitalSigns}</p>
            </div>
            <Heart className="h-10 w-10 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Bilans prescrits</p>
              <p className="text-3xl font-bold text-purple-900">{stats.testsRequested}</p>
            </div>
            <Droplet className="h-10 w-10 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Résultats reçus</p>
              <p className="text-3xl font-bold text-orange-900">{stats.testsReceived}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-orange-400" />
          </div>
        </div>
      </motion.div>

      {/* Liste des consultations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des consultations...</p>
          </div>
        ) : todayConsultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune consultation ce jour
            </h3>
            <p className="text-gray-600">
              Sélectionnez une autre date ou revenez aujourd'hui
            </p>
          </div>
        ) : (
          todayConsultations.map((consultation, index) => {
            const isExpanded = expandedConsultations[consultation.id]
            const duration = consultation.startTime && consultation.endTime
              ? Math.floor((new Date(consultation.endTime) - new Date(consultation.startTime)) / 60000)
              : 0

            return (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* En-tête consultation */}
                <div
                  className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => toggleConsultationDetails(consultation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {consultation.patient?.fullName || 'Patient'}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {consultation.startTime && (
                            <span className="text-sm text-gray-600">
                              🕐 {new Date(consultation.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          {duration > 0 && (
                            <span className="text-sm text-gray-600">⏱️ {duration} min</span>
                          )}
                          <span className="text-sm text-gray-600">
                            📋 {consultation.motif}
                          </span>
                          {consultation.patient?.maladieChronique && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              {consultation.patient.maladieChronique}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Indicateurs */}
                      {consultation.vitalSigns && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <Heart className="h-3 w-3" />
                          <span>Constantes</span>
                        </div>
                      )}
                      {consultation.biologicalTests && consultation.biologicalTests.length > 0 && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <Droplet className="h-3 w-3" />
                          <span>{consultation.biologicalTests.length}</span>
                        </div>
                      )}
                      {consultation.clinicalSummary && (
                        <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <FileText className="h-3 w-3" />
                          <span>Résumé</span>
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails consultation (accordéon) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 space-y-4">
                        {/* Résumé clinique */}
                        {consultation.clinicalSummary && (
                          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                            <div className="flex items-start space-x-3">
                              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                                  Résumé clinique
                                </h4>
                                <p className="text-sm text-blue-800">
                                  {consultation.clinicalSummary}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Constantes vitales */}
                        {consultation.vitalSigns && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                              <Heart className="h-4 w-4 mr-2 text-red-500" />
                              Constantes vitales mesurées
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {consultation.vitalSigns.bloodPressureSystolic && (
                                <VitalSignCard
                                  icon={Activity}
                                  label="Tension artérielle"
                                  value={`${consultation.vitalSigns.bloodPressureSystolic}/${consultation.vitalSigns.bloodPressureDiastolic || '?'}`}
                                  unit="mmHg"
                                  status={checkVitalSignStatus('bloodPressureSystolic', consultation.vitalSigns.bloodPressureSystolic)}
                                  delay={0}
                                />
                              )}
                              {consultation.vitalSigns.heartRate && (
                                <VitalSignCard
                                  icon={Heart}
                                  label="Rythme cardiaque"
                                  value={consultation.vitalSigns.heartRate}
                                  unit="bpm"
                                  status={checkVitalSignStatus('heartRate', consultation.vitalSigns.heartRate)}
                                  delay={0.05}
                                />
                              )}
                              {(consultation.vitalSigns.temperature || consultation.vitalSigns.pcm) && (
                                <VitalSignCard
                                  icon={Thermometer}
                                  label="Température"
                                  value={consultation.vitalSigns.temperature || consultation.vitalSigns.pcm}
                                  unit="°C"
                                  status={checkVitalSignStatus('temperature', consultation.vitalSigns.temperature || consultation.vitalSigns.pcm)}
                                  delay={0.1}
                                />
                              )}
                              {consultation.vitalSigns.weight && (
                                <VitalSignCard
                                  icon={Weight}
                                  label="Poids"
                                  value={consultation.vitalSigns.weight}
                                  unit="kg"
                                  status="normal"
                                  delay={0.15}
                                />
                              )}
                              {consultation.vitalSigns.height && (
                                <VitalSignCard
                                  icon={Ruler}
                                  label="Taille"
                                  value={consultation.vitalSigns.height}
                                  unit="cm"
                                  status="normal"
                                  delay={0.2}
                                />
                              )}
                              {consultation.vitalSigns.bmi && (
                                <VitalSignCard
                                  icon={TrendingUp}
                                  label="IMC"
                                  value={consultation.vitalSigns.bmi}
                                  unit="kg/m²"
                                  status={checkVitalSignStatus('bmi', consultation.vitalSigns.bmi)}
                                  delay={0.25}
                                />
                              )}
                              {consultation.vitalSigns.oxygenSaturation && (
                                <VitalSignCard
                                  icon={Wind}
                                  label="Saturation O₂"
                                  value={consultation.vitalSigns.oxygenSaturation}
                                  unit="%"
                                  status={checkVitalSignStatus('oxygenSaturation', consultation.vitalSigns.oxygenSaturation)}
                                  delay={0.3}
                                />
                              )}
                              {consultation.vitalSigns.respiratoryRate && (
                                <VitalSignCard
                                  icon={Wind}
                                  label="Fréq. respiratoire"
                                  value={consultation.vitalSigns.respiratoryRate}
                                  unit="/min"
                                  status={checkVitalSignStatus('respiratoryRate', consultation.vitalSigns.respiratoryRate)}
                                  delay={0.35}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Données biologiques */}
                        {consultation.biologicalTests && consultation.biologicalTests.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                              <Droplet className="h-4 w-4 mr-2 text-purple-500" />
                              Analyses biologiques ({consultation.biologicalTests.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {consultation.biologicalTests.map((test, idx) => (
                                <BiologicalTestCard
                                  key={idx}
                                  test={test.test}
                                  status={test.status}
                                  date={test.date}
                                  result={test.result}
                                  delay={0.05 * idx}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {consultation.documents && consultation.documents.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                              <Upload className="h-4 w-4 mr-2 text-blue-500" />
                              Documents liés ({consultation.documents.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {consultation.documents.map((doc, idx) => (
                                <button
                                  key={idx}
                                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                                >
                                  <FileText className="h-4 w-4 text-gray-600" />
                                  <span>{doc.type}</span>
                                  <Download className="h-3 w-3 text-gray-500" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Synthèse automatique */}
      {todayConsultations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
            Synthèse du jour
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              ✅ <strong>{stats.totalConsultations}</strong> consultation{stats.totalConsultations > 1 ? 's' : ''} réalisée{stats.totalConsultations > 1 ? 's' : ''} ce jour
            </p>
            {stats.totalVitalSigns > 0 && (
              <p>
                ❤️ <strong>{stats.totalVitalSigns}</strong> ensemble{stats.totalVitalSigns > 1 ? 's' : ''} de constantes vitales mesuré{stats.totalVitalSigns > 1 ? 's' : ''}
              </p>
            )}
            {stats.testsRequested > 0 && (
              <p>
                💉 <strong>{stats.testsRequested}</strong> bilan{stats.testsRequested > 1 ? 's' : ''} biologique{stats.testsRequested > 1 ? 's' : ''} prescrit{stats.testsRequested > 1 ? 's' : ''}
              </p>
            )}
            {stats.testsReceived > 0 && (
              <p>
                📊 <strong>{stats.testsReceived}</strong> résultat{stats.testsReceived > 1 ? 's' : ''} d'analyse reçu{stats.testsReceived > 1 ? 's' : ''}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-300">
              💡 Les données sont synchronisées automatiquement avec les profils patients pour un suivi longitudinal optimal.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default HistorySimple
