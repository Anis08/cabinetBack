/**
 * Tests unitaires pour les calculs de constantes vitales
 * 
 * Tests de la formule Mosteller (2021) pour le calcul du BSA
 */

import { 
  calculateBSA, 
  calculateIMC, 
  enrichPatientWithCalculations,
  categorizeBSA,
  getBSAInfo 
} from '../vitalSignsCalculations.js';

describe('calculateBSA - Body Surface Area (Mosteller 2021)', () => {
  test('calcule correctement le BSA avec des valeurs normales', () => {
    // Adulte moyen : 70 kg, 175 cm
    const bsa = calculateBSA(70, 175);
    expect(bsa).toBe(1.85);
  });

  test('calcule correctement le BSA pour un homme grand', () => {
    // 90 kg, 185 cm
    const bsa = calculateBSA(90, 185);
    expect(bsa).toBe(2.14);
  });

  test('calcule correctement le BSA pour une femme moyenne', () => {
    // 60 kg, 165 cm
    const bsa = calculateBSA(60, 165);
    expect(bsa).toBe(1.65);
  });

  test('calcule correctement le BSA pour un enfant', () => {
    // 30 kg, 130 cm
    const bsa = calculateBSA(30, 130);
    expect(bsa).toBe(1.03);
  });

  test('retourne null si le poids est manquant', () => {
    const bsa = calculateBSA(null, 175);
    expect(bsa).toBeNull();
  });

  test('retourne null si la taille est manquante', () => {
    const bsa = calculateBSA(70, null);
    expect(bsa).toBeNull();
  });

  test('retourne null si les deux valeurs sont manquantes', () => {
    const bsa = calculateBSA(null, null);
    expect(bsa).toBeNull();
  });

  test('retourne null si le poids est 0', () => {
    const bsa = calculateBSA(0, 175);
    expect(bsa).toBeNull();
  });

  test('retourne null si la taille est 0', () => {
    const bsa = calculateBSA(70, 0);
    expect(bsa).toBeNull();
  });

  test('retourne null si le poids est négatif', () => {
    const bsa = calculateBSA(-70, 175);
    expect(bsa).toBeNull();
  });

  test('retourne null si la taille est négative', () => {
    const bsa = calculateBSA(70, -175);
    expect(bsa).toBeNull();
  });

  test('arrondit correctement à 2 décimales', () => {
    // 75 kg, 180 cm = 1.94999... → 1.95
    const bsa = calculateBSA(75, 180);
    expect(bsa).toBe(1.95);
  });

  test('gère les valeurs extrêmes (obésité morbide)', () => {
    // 150 kg, 170 cm
    const bsa = calculateBSA(150, 170);
    expect(bsa).toBe(2.58);
  });

  test('gère les valeurs extrêmes (maigreur extrême)', () => {
    // 40 kg, 160 cm
    const bsa = calculateBSA(40, 160);
    expect(bsa).toBe(1.33);
  });
});

describe('calculateIMC - Indice de Masse Corporelle', () => {
  test('calcule correctement l\'IMC avec des valeurs normales', () => {
    // 70 kg, 175 cm → IMC = 22.9
    const imc = calculateIMC(70, 175);
    expect(imc).toBe(22.9);
  });

  test('calcule correctement l\'IMC pour surpoids', () => {
    // 90 kg, 175 cm → IMC = 29.4
    const imc = calculateIMC(90, 175);
    expect(imc).toBe(29.4);
  });

  test('calcule correctement l\'IMC pour maigreur', () => {
    // 50 kg, 175 cm → IMC = 16.3
    const imc = calculateIMC(50, 175);
    expect(imc).toBe(16.3);
  });

  test('retourne null si le poids est manquant', () => {
    const imc = calculateIMC(null, 175);
    expect(imc).toBeNull();
  });

  test('retourne null si la taille est manquante', () => {
    const imc = calculateIMC(70, null);
    expect(imc).toBeNull();
  });

  test('arrondit correctement à 1 décimale', () => {
    const imc = calculateIMC(70, 175);
    expect(imc).toBe(22.9);
  });
});

describe('enrichPatientWithCalculations', () => {
  test('enrichit un patient avec BSA et IMC', () => {
    const patient = {
      id: 1,
      fullName: 'Jean Dupont',
      poids: 70,
      taille: 175
    };

    const enriched = enrichPatientWithCalculations(patient);

    expect(enriched).toHaveProperty('bsa', 1.85);
    expect(enriched).toHaveProperty('imc', 22.9);
    expect(enriched.fullName).toBe('Jean Dupont');
  });

  test('retourne null pour BSA si données manquantes', () => {
    const patient = {
      id: 1,
      fullName: 'Jean Dupont',
      poids: null,
      taille: 175
    };

    const enriched = enrichPatientWithCalculations(patient);

    expect(enriched.bsa).toBeNull();
    expect(enriched.imc).toBeNull();
  });

  test('utilise l\'IMC existant si disponible', () => {
    const patient = {
      id: 1,
      fullName: 'Jean Dupont',
      poids: 70,
      taille: 175,
      imc: 23.0 // IMC existant différent du calculé
    };

    const enriched = enrichPatientWithCalculations(patient);

    expect(enriched.imc).toBe(23.0); // Garde l'IMC existant
    expect(enriched.bsa).toBe(1.85);
  });

  test('gère un patient null', () => {
    const enriched = enrichPatientWithCalculations(null);
    expect(enriched).toBeNull();
  });
});

describe('categorizeBSA - Catégorisation selon valeurs de référence', () => {
  test('catégorise comme très faible (< 1.5)', () => {
    expect(categorizeBSA(1.3)).toBe('tres_faible');
    expect(categorizeBSA(1.0)).toBe('tres_faible');
    expect(categorizeBSA(1.49)).toBe('tres_faible');
  });

  test('catégorise comme faible (1.5 - 1.7)', () => {
    expect(categorizeBSA(1.5)).toBe('faible');
    expect(categorizeBSA(1.6)).toBe('faible');
    expect(categorizeBSA(1.69)).toBe('faible');
  });

  test('catégorise comme normal (1.7 - 2.0)', () => {
    expect(categorizeBSA(1.7)).toBe('normal');
    expect(categorizeBSA(1.85)).toBe('normal');
    expect(categorizeBSA(2.0)).toBe('normal');
  });

  test('catégorise comme élevé (> 2.0)', () => {
    expect(categorizeBSA(2.01)).toBe('eleve');
    expect(categorizeBSA(2.5)).toBe('eleve');
    expect(categorizeBSA(3.0)).toBe('eleve');
  });

  test('catégorise comme non calculable si null', () => {
    expect(categorizeBSA(null)).toBe('non_calculable');
    expect(categorizeBSA(0)).toBe('non_calculable');
    expect(categorizeBSA(-1)).toBe('non_calculable');
  });
});

describe('getBSAInfo - Informations détaillées sur le BSA', () => {
  test('retourne des informations complètes pour un BSA normal', () => {
    const info = getBSAInfo(1.85);

    expect(info).toHaveProperty('value', 1.85);
    expect(info).toHaveProperty('category', 'normal');
    expect(info).toHaveProperty('unit', 'm²');
    expect(info).toHaveProperty('formula');
    expect(info.formula).toContain('Mosteller');
    expect(info).toHaveProperty('reference');
  });

  test('retourne des informations pour BSA manquant', () => {
    const info = getBSAInfo(null);

    expect(info.value).toBeNull();
    expect(info.category).toBe('non_calculable');
    expect(info.description).toContain('manquant');
  });

  test('contient la formule Mosteller', () => {
    const info = getBSAInfo(1.85);
    expect(info.formula).toContain('3600');
    expect(info.formula).toContain('taille');
    expect(info.formula).toContain('poids');
  });

  test('contient la plage de référence', () => {
    const info = getBSAInfo(1.85);
    expect(info.reference).toContain('1.7');
    expect(info.reference).toContain('2.0');
  });
});

describe('Cas réels - Validation clinique', () => {
  test('Homme adulte moyen européen', () => {
    // Référence : 75 kg, 178 cm → BSA ≈ 1.93 m²
    const bsa = calculateBSA(75, 178);
    expect(bsa).toBeCloseTo(1.93, 1);
  });

  test('Femme adulte moyenne européenne', () => {
    // Référence : 65 kg, 165 cm → BSA ≈ 1.71 m²
    const bsa = calculateBSA(65, 165);
    expect(bsa).toBeCloseTo(1.71, 1);
  });

  test('Enfant de 10 ans', () => {
    // Référence : 35 kg, 140 cm → BSA ≈ 1.17 m²
    const bsa = calculateBSA(35, 140);
    expect(bsa).toBeCloseTo(1.17, 1);
  });

  test('Athlète de haut niveau', () => {
    // Référence : 95 kg, 190 cm → BSA ≈ 2.26 m²
    const bsa = calculateBSA(95, 190);
    expect(bsa).toBeCloseTo(2.26, 1);
  });

  test('Personne âgée', () => {
    // Référence : 60 kg, 160 cm → BSA ≈ 1.62 m²
    const bsa = calculateBSA(60, 160);
    expect(bsa).toBeCloseTo(1.62, 1);
  });
});
