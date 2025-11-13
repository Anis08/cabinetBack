/**
 * Utilitaires pour le calcul des constantes vitales
 * 
 * Formules médicales standardisées pour le calcul de l'IMC, BSA, etc.
 */

/**
 * Calcule la Surface Corporelle (BSA - Body Surface Area) selon la formule Mosteller (2021)
 * 
 * Formule : BSA = sqrt((taille_cm × poids_kg) / 3600)
 * 
 * @param {number} poids - Poids en kilogrammes (kg)
 * @param {number} taille - Taille en centimètres (cm)
 * @returns {number|null} Surface corporelle en m² (2 décimales) ou null si données manquantes
 * 
 * @example
 * calculateBSA(70, 175) // Returns 1.85
 * calculateBSA(null, 175) // Returns null
 */
export const calculateBSA = (poids, taille) => {
  // Vérifier que les deux valeurs sont présentes et valides
  if (!poids || !taille || poids <= 0 || taille <= 0) {
    return null;
  }

  // Formule Mosteller (2021) : BSA = sqrt((taille_cm * poids_kg) / 3600)
  const bsa = Math.sqrt((taille * poids) / 3600);
  
  // Retourner avec 2 décimales
  return parseFloat(bsa.toFixed(2));
};

/**
 * Calcule l'IMC (Indice de Masse Corporelle) / BMI
 * 
 * Formule : IMC = poids_kg / (taille_m)²
 * 
 * @param {number} poids - Poids en kilogrammes (kg)
 * @param {number} taille - Taille en centimètres (cm)
 * @returns {number|null} IMC avec 1 décimale ou null si données manquantes
 * 
 * @example
 * calculateIMC(70, 175) // Returns 22.9
 */
export const calculateIMC = (poids, taille) => {
  if (!poids || !taille || poids <= 0 || taille <= 0) {
    return null;
  }

  // Convertir taille en mètres
  const tailleMetres = taille / 100;
  const imc = poids / (tailleMetres * tailleMetres);
  
  return parseFloat(imc.toFixed(1));
};

/**
 * Enrichit un objet patient avec les calculs de BSA et IMC
 * 
 * @param {Object} patient - Objet patient avec poids et taille
 * @returns {Object} Patient enrichi avec bsa et imc calculés
 */
export const enrichPatientWithCalculations = (patient) => {
  if (!patient) return null;

  const poids = patient.poids;
  const taille = patient.taille;

  return {
    ...patient,
    bsa: calculateBSA(poids, taille),
    imc: patient.imc || calculateIMC(poids, taille) // Utiliser l'IMC existant si disponible
  };
};

/**
 * Enrichit les constantes vitales d'un rendez-vous avec BSA
 * 
 * @param {Object} rendezVous - Objet rendez-vous avec poids et patient.taille
 * @returns {Object} Constantes vitales enrichies avec BSA
 */
export const enrichVitalSignsWithBSA = (rendezVous) => {
  if (!rendezVous) return null;

  const poids = rendezVous.poids;
  const taille = rendezVous.patient?.taille;
  const imc = rendezVous.imc;

  return {
    weight: poids || null,
    height: taille || null,
    bmi: imc || null,
    bsa: calculateBSA(poids, taille),
    pcm: rendezVous.pcm || null,
    pulse: rendezVous.pulse || null,
    bloodPressure: {
      systolic: rendezVous.paSystolique || null,
      diastolic: rendezVous.paDiastolique || null
    }
  };
};

/**
 * Catégorise le BSA selon les valeurs normales
 * 
 * Valeurs de référence :
 * - Très faible : < 1.5 m²
 * - Faible : 1.5 - 1.7 m²
 * - Normal : 1.7 - 2.0 m²
 * - Élevé : > 2.0 m²
 * 
 * @param {number} bsa - Surface corporelle en m²
 * @returns {string} Catégorie du BSA
 */
export const categorizeBSA = (bsa) => {
  if (!bsa || bsa <= 0) return 'non_calculable';
  if (bsa < 1.5) return 'tres_faible';
  if (bsa < 1.7) return 'faible';
  if (bsa <= 2.0) return 'normal';
  return 'eleve';
};

/**
 * Retourne des informations détaillées sur le BSA
 * 
 * @param {number} bsa - Surface corporelle en m²
 * @returns {Object} Informations détaillées incluant catégorie et description
 */
export const getBSAInfo = (bsa) => {
  if (!bsa) {
    return {
      value: null,
      category: 'non_calculable',
      description: 'Poids ou taille manquant',
      formula: 'Mosteller (2021)',
      unit: 'm²'
    };
  }

  return {
    value: bsa,
    category: categorizeBSA(bsa),
    description: `Surface corporelle calculée selon la formule Mosteller (2021)`,
    formula: 'BSA = √((taille_cm × poids_kg) / 3600)',
    unit: 'm²',
    reference: 'Plage normale : 1.7 - 2.0 m²'
  };
};

export default {
  calculateBSA,
  calculateIMC,
  enrichPatientWithCalculations,
  enrichVitalSignsWithBSA,
  categorizeBSA,
  getBSAInfo
};
