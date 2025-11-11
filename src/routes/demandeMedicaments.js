import express from 'express';
import {
  getAllDemandes,
  getMesDemandes,
  getDemandeById,
  createDemande,
  accepterDemande,
  rejeterDemande,
  deleteDemande
} from '../controllers/demandeMedicamentController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification JWT
router.use(verifyAccessToken);

/**
 * Routes pour la gestion des demandes de médicaments
 */

// GET /medecin/demandes-medicaments - Récupérer toutes les demandes (admin)
// Query params: status, startDate, endDate
router.get('/', getAllDemandes);

// GET /medecin/demandes-medicaments/mes-demandes - Mes demandes uniquement
// Query params: status
router.get('/mes-demandes', getMesDemandes);

// GET /medecin/demandes-medicaments/:id - Récupérer une demande par ID
router.get('/:id', getDemandeById);

// POST /medecin/demandes-medicaments - Créer une demande
// Body: { nom, dosage, forme, fabricant, moleculeMere, type, frequence }
router.post('/', createDemande);

// POST /medecin/demandes-medicaments/:id/accepter - Accepter une demande (admin)
router.post('/:id/accepter', accepterDemande);

// POST /medecin/demandes-medicaments/:id/rejeter - Rejeter une demande (admin)
// Body: { motifRejet: string }
router.post('/:id/rejeter', rejeterDemande);

// DELETE /medecin/demandes-medicaments/:id - Supprimer une demande (créateur uniquement)
router.delete('/:id', deleteDemande);

export default router;
