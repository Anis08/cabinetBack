import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Pill } from 'lucide-react';
import { baseURL } from '../config';

/**
 * Composant d'autocomplétion pour la recherche de médicaments
 * 
 * Utilisation:
 * <MedicamentAutocomplete
 *   onSelect={(medicament) => console.log('Médicament sélectionné:', medicament)}
 *   placeholder="Rechercher un médicament..."
 * />
 */
const MedicamentAutocomplete = ({ onSelect, placeholder = "Rechercher un médicament..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rechercher les médicaments avec debounce
  useEffect(() => {
    const searchMedicaments = async () => {
      if (searchTerm.length < 2) {
        setMedicaments([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseURL}/medecin/medicaments/search?q=${encodeURIComponent(searchTerm)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMedicaments(data.medicaments || []);
          setShowDropdown(true);
        } else {
          console.error('Erreur lors de la recherche:', response.status);
          setMedicaments([]);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setMedicaments([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce: attendre 300ms après la dernière frappe
    const timeoutId = setTimeout(searchMedicaments, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Gérer la sélection avec le clavier
  const handleKeyDown = (e) => {
    if (!showDropdown || medicaments.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < medicaments.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < medicaments.length) {
          handleSelect(medicaments[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Gérer la sélection d'un médicament
  const handleSelect = (medicament) => {
    onSelect(medicament);
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Réinitialiser la recherche
  const handleClear = () => {
    setSearchTerm('');
    setMedicaments([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          autoComplete="off"
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown des résultats */}
      {showDropdown && searchTerm.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {medicaments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Pill className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucun médicament trouvé</p>
              <p className="text-xs text-gray-400 mt-1">
                Essayez un autre terme de recherche
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {medicaments.map((medicament, index) => (
                <li
                  key={medicament.id}
                  onClick={() => handleSelect(medicament)}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors
                    ${index === selectedIndex 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p className="font-semibold text-gray-900">
                          {medicament.nom}
                        </p>
                      </div>
                      
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {medicament.dosage}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">
                          {medicament.forme}
                        </span>
                        {medicament.type && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {medicament.type}
                          </span>
                        )}
                      </div>
                      
                      {medicament.moleculeMere && medicament.moleculeMere !== medicament.nom && (
                        <p className="mt-1 text-xs text-gray-500">
                          Molécule: {medicament.moleculeMere}
                        </p>
                      )}
                      
                      {medicament.fabricant && (
                        <p className="mt-1 text-xs text-gray-400">
                          {medicament.fabricant}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-2 flex-shrink-0">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* Footer avec le nombre de résultats */}
          {medicaments.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {medicaments.length} résultat{medicaments.length > 1 ? 's' : ''} trouvé{medicaments.length > 1 ? 's' : ''}
              <span className="ml-2 text-gray-400">
                • Utilisez ↑↓ pour naviguer, Entrée pour sélectionner
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicamentAutocomplete;
