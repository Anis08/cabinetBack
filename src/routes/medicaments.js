import express from 'express';
import {
  getAllMedicaments,
  searchMedicaments,
  getMedicamentById,
  createMedicament,
  updateMedicament,
  deleteMedicament
} from '../controllers/medicamentController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification JWT

/**
 * Routes pour la gestion des médicaments
 */

// GET /medecin/medicaments - Récupérer tous les médicaments (avec filtres optionnels)
// Query params: search, type, moleculeMere, dosage, dateDebut, dateFin
router.get('/', getAllMedicaments);

// GET /medecin/medicaments/search - Recherche rapide (autocomplete)
// Query params: q (required, min 2 chars)
router.get('/search', searchMedicaments);

// GET /medecin/medicaments/:id - Récupérer un médicament par ID
router.get('/:id', getMedicamentById);

// POST /medecin/medicaments - Créer un nouveau médicament
// Body: { nom, dosage, forme, fabricant, moleculeMere, type, frequence }
router.post('/', createMedicament);

// PUT /medecin/medicaments/:id - Modifier un médicament
// Body: { nom, dosage, forme, fabricant, moleculeMere, type, frequence }
router.put('/:id', updateMedicament);

// DELETE /medecin/medicaments/:id - Supprimer un médicament
router.delete('/:id', deleteMedicament);

export default router;
