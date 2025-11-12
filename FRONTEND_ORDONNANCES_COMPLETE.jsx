import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Search, Filter, Calendar, User, Download, Eye, Trash2, Edit } from 'lucide-react'
import OrdonnanceEditor from '../components/Ordonnances/OrdonnanceEditor'
import { baseURL } from '../config'
import { useAuth } from '../store/AuthProvider'

const Ordonnances = () => {
  const { logout, refresh } = useAuth()
  const [ordonnances, setOrdonnances] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientSelector, setShowPatientSelector] = useState(false)
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, today: 0 })
  const [editingOrdonnance, setEditingOrdonnance] = useState(null)

  useEffect(() => {
    fetchOrdonnances()
    fetchPatients()
  }, [])

  // ===========================
  // FETCH FUNCTIONS
  // ===========================

  const fetchOrdonnances = async () => {
    try {
      setLoading(true)
      let response = await fetch(`${baseURL}/medecin/ordonnances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          const refreshResponse = await refresh()
          if (!refreshResponse) {
            logout()
            return
          }
          response = await fetch(`${baseURL}/medecin/ordonnances`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          })
        }
      }

      if (response.ok) {
        const data = await response.json()
        setOrdonnances(data.ordonnances || [])
        setStats(data.stats || { total: 0, thisMonth: 0, today: 0 })
        console.log(`Loaded ${data.ordonnances?.length || 0} ordonnances`)
      } else {
        console.warn('Error fetching ordonnances:', response.status)
        setOrdonnances([])
      }
    } catch (error) {
      console.error('Error fetching ordonnances:', error)
      setOrdonnances([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      let response = await fetch(`${baseURL}/medecin/list-patients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          const refreshResponse = await refresh()
          if (!refreshResponse) {
            logout()
            return
          }
          response = await fetch(`${baseURL}/medecin/list-patients`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          })
        }
      }

      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.warn('Error fetching patients:', response.status)
        setPatients([])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      setPatients([])
    }
  }

  // ===========================
  // HANDLER FUNCTIONS
  // ===========================

  const handleOpenEditor = () => {
    if (patients.length > 0) {
      setEditingOrdonnance(null)
      setShowPatientSelector(true)
    } else {
      alert('Aucun patient disponible. Veuillez d\'abord créer un patient.')
    }
  }

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
    setShowPatientSelector(false)
    setIsEditorOpen(true)
  }

  const handleSaveOrdonnance = async (ordonnanceData) => {
    try {
      const token = localStorage.getItem('token')
      
      // Transform medicaments to match API format
      const requestBody = {
        patientId: editingOrdonnance 
          ? ordonnanceData.patientId 
          : parseInt(selectedPatient.id || selectedPatient._id),
        dateValidite: ordonnanceData.dateValidite || null,
        note: ordonnanceData.observations || ordonnanceData.note || '',
        rendezVousId: ordonnanceData.rendezVousId || null,
        medicaments: ordonnanceData.medicaments.map(med => ({
          medicamentId: med.medicamentId || med.id,
          posologie: med.frequence || med.posologie || '1 fois par jour',
          duree: med.duree || '1 mois',
          instructions: med.instructions || ''
        }))
      }

      let response
      if (editingOrdonnance) {
        // Update existing ordonnance
        response = await fetch(`${baseURL}/medecin/ordonnances/${editingOrdonnance.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        })
      } else {
        // Create new ordonnance
        response = await fetch(`${baseURL}/medecin/ordonnances`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde')
      }

      const data = await response.json()
      
      if (response.status === 201 || response.status === 200) {
        alert(editingOrdonnance 
          ? 'Ordonnance modifiée avec succès!' 
          : 'Ordonnance créée avec succès!')
        setIsEditorOpen(false)
        setEditingOrdonnance(null)
        setSelectedPatient(null)
        fetchOrdonnances() // Refresh list
      } else if (response.status === 202) {
        // Demande de médicament créée
        alert('Demande de médicament créée. L\'ordonnance sera disponible après validation.')
        setIsEditorOpen(false)
        setEditingOrdonnance(null)
        setSelectedPatient(null)
      }
    } catch (error) {
      console.error('Error saving ordonnance:', error)
      alert(`Erreur: ${error.message}`)
    }
  }

  const handleViewOrdonnance = async (ordonnance) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Open modal or navigate to view page with full details
        console.log('Full ordonnance details:', data.ordonnance)
        alert('Fonctionnalité de visualisation en développement')
        // TODO: Implement ordonnance viewer modal
      }
    } catch (error) {
      console.error('Error viewing ordonnance:', error)
    }
  }

  const handleEditOrdonnance = async (ordonnance) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setEditingOrdonnance(data.ordonnance)
        setSelectedPatient(data.ordonnance.patient)
        setIsEditorOpen(true)
      }
    } catch (error) {
      console.error('Error loading ordonnance for edit:', error)
      alert('Erreur lors du chargement de l\'ordonnance')
    }
  }

  const handleDownloadOrdonnance = async (ordonnance) => {
    // TODO: Implement PDF generation
    console.log('Download ordonnance:', ordonnance)
    alert('Fonctionnalité PDF en développement')
  }

  const handleDeleteOrdonnance = async (ordonnance) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'ordonnance du ${new Date(ordonnance.dateCreation).toLocaleDateString()} ?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${baseURL}/medecin/ordonnances/${ordonnance.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        alert('Ordonnance supprimée avec succès')
        fetchOrdonnances() // Refresh list
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error deleting ordonnance:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // ===========================
  // FILTERING
  // ===========================

  const filteredOrdonnances = ordonnances.filter(ord => {
    const patientName = ord.patient?.fullName || ''
    const searchLower = searchTerm.toLowerCase()
    return patientName.toLowerCase().includes(searchLower)
  })

  // ===========================
  // RENDER
  // ===========================

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
            placeholder="Rechercher par patient..."
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médicaments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validité
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrdonnances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-lg font-medium">Aucune ordonnance trouvée</p>
                    <p className="text-sm mt-1">Créez votre première ordonnance pour commencer</p>
                  </td>
                </tr>
              ) : (
                filteredOrdonnances.map((ordonnance) => (
                  <tr key={ordonnance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ordonnance.patient?.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ordonnance.patient?.phoneNumber || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(ordonnance.dateCreation).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {ordonnance.medicaments?.length || 0} médicament(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {ordonnance.medicaments?.slice(0, 2).map(m => 
                          m.medicament?.nom || 'N/A'
                        ).join(', ')}
                        {ordonnance.medicaments?.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ordonnance.dateValidite ? (
                        <span className="text-sm text-gray-900">
                          {new Date(ordonnance.dateValidite).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Non spécifiée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewOrdonnance(ordonnance)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrdonnance(ordonnance)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadOrdonnance(ordonnance)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                          title="Télécharger PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrdonnance(ordonnance)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                Sélectionner un patient
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
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient._id || patient.id}
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
            setEditingOrdonnance(null)
          }}
          patient={selectedPatient}
          ordonnance={editingOrdonnance}
          onSave={handleSaveOrdonnance}
        />
      )}
    </div>
  )
}

export default Ordonnances
