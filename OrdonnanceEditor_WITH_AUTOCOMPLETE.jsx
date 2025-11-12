import React, { useState } from 'react';
import { X, Plus, Trash2, Save, FileText } from 'lucide-react';
import MedicamentAutocomplete from './MedicamentAutocomplete';

/**
 * Éditeur d'ordonnance avec autocomplétion de médicaments
 * 
 * Utilisation:
 * <OrdonnanceEditor
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   patient={patient}
 *   onSave={(ordonnanceData) => console.log(ordonnanceData)}
 * />
 */
const OrdonnanceEditor = ({ isOpen, onClose, patient, onSave }) => {
  const [dateValidite, setDateValidite] = useState('');
  const [observations, setObservations] = useState('');
  const [medicaments, setMedicaments] = useState([]);

  if (!isOpen) return null;

  // Ajouter un médicament sélectionné depuis l'autocomplete
  const handleAddMedicament = (medicament) => {
    const newMedicament = {
      id: medicament.id,
      medicamentId: medicament.id,
      nom: medicament.nom,
      dosage: medicament.dosage,
      forme: medicament.forme,
      type: medicament.type,
      moleculeMere: medicament.moleculeMere,
      fabricant: medicament.fabricant,
      frequence: medicament.frequence || '1 fois par jour',
      duree: '1 mois',
      instructions: ''
    };

    setMedicaments([...medicaments, newMedicament]);
  };

  // Supprimer un médicament
  const handleRemoveMedicament = (index) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  // Mettre à jour un champ de médicament
  const handleUpdateMedicament = (index, field, value) => {
    const updated = [...medicaments];
    updated[index] = { ...updated[index], [field]: value };
    setMedicaments(updated);
  };

  // Sauvegarder l'ordonnance
  const handleSave = () => {
    if (medicaments.length === 0) {
      alert('Veuillez ajouter au moins un médicament');
      return;
    }

    const ordonnanceData = {
      patientId: patient.id,
      dateValidite: dateValidite || null,
      observations,
      medicaments: medicaments.map(med => ({
        medicamentId: med.medicamentId,
        nom: med.nom,
        dosage: med.dosage,
        forme: med.forme,
        type: med.type,
        frequence: med.frequence,
        duree: med.duree,
        instructions: med.instructions
      }))
    };

    onSave(ordonnanceData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-500">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Nouvelle Ordonnance</h2>
              <p className="text-sm text-purple-100">
                Pour: {patient?.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Date de validité */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date de validité (optionnelle)
            </label>
            <input
              type="date"
              value={dateValidite}
              onChange={(e) => setDateValidite(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Recherche de médicaments avec autocomplétion */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rechercher et ajouter des médicaments
            </label>
            <MedicamentAutocomplete
              onSelect={handleAddMedicament}
              placeholder="Tapez le nom d'un médicament (ex: Doliprane, Amoxicilline...)"
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Astuce: Tapez au moins 2 caractères pour voir les suggestions
            </p>
          </div>

          {/* Liste des médicaments ajoutés */}
          {medicaments.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Médicaments ajoutés ({medicaments.length})
              </label>
              <div className="space-y-4">
                {medicaments.map((med, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4"
                  >
                    {/* Header du médicament */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{med.nom}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                            {med.dosage}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            {med.forme}
                          </span>
                          {med.type && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {med.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMedicament(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Champs de posologie */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Posologie (Fréquence) *
                        </label>
                        <input
                          type="text"
                          value={med.frequence}
                          onChange={(e) => handleUpdateMedicament(index, 'frequence', e.target.value)}
                          placeholder="1 fois par jour"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Durée
                        </label>
                        <input
                          type="text"
                          value={med.duree}
                          onChange={(e) => handleUpdateMedicament(index, 'duree', e.target.value)}
                          placeholder="1 mois"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Instructions
                        </label>
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => handleUpdateMedicament(index, 'instructions', e.target.value)}
                          placeholder="Le matin"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {medicaments.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Aucun médicament ajouté</p>
              <p className="text-sm text-gray-500 mt-1">
                Utilisez la recherche ci-dessus pour ajouter des médicaments
              </p>
            </div>
          )}

          {/* Observations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observations / Notes
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
              placeholder="Notes supplémentaires pour le patient ou le pharmacien..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={medicaments.length === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
              ${medicaments.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:scale-105'
              }
            `}
          >
            <Save className="w-4 h-4" />
            Créer l'ordonnance
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdonnanceEditor;
