import express from 'express';
import {
  getAllOrdonnances,
  getOrdonnancesByPatient,
  getOrdonnanceById,
  createOrdonnance,
  updateOrdonnance,
  deleteOrdonnance
} from '../controllers/ordonnanceController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification JWT
router.use(verifyAccessToken);

/**
 * Routes pour la gestion des ordonnances
 */

// GET /medecin/ordonnances - Récupérer toutes les ordonnances du médecin
// Query params: patientId, startDate, endDate, limit
router.get('/', getAllOrdonnances);

// GET /medecin/ordonnances/patient/:patientId - Récupérer les ordonnances d'un patient
router.get('/patient/:patientId', getOrdonnancesByPatient);

// GET /medecin/ordonnances/:id - Récupérer une ordonnance par ID
router.get('/:id', getOrdonnanceById);

// POST /medecin/ordonnances - Créer une nouvelle ordonnance
// Body: {
//   patientId: number,
//   rendezVousId?: number,
//   dateValidite?: string,
//   note?: string,
//   medicaments: [
//     {
//       medicamentId?: number,
//       medicamentData?: { nom, dosage, forme, fabricant, moleculeMere, type, frequence },
//       posologie: string,
//       duree?: string,
//       instructions?: string
//     }
//   ]
// }
router.post('/', createOrdonnance);

// PUT /medecin/ordonnances/:id - Modifier une ordonnance
// Body: { dateValidite?, note?, medicaments? }
router.put('/:id', updateOrdonnance);

// DELETE /medecin/ordonnances/:id - Supprimer une ordonnance
router.delete('/:id', deleteOrdonnance);

export default router;
