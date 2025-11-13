import express from 'express';
import { 
  newPatient, 
  listPatients, 
  newRendezVous, 
  test, 
  listTodayAppointments, 
  getPatientProfile, 
  updatePatient,
  deletePatient,
  addToWaitingListToday, 
  getCompletedAppointments, 
  getCompletedAppointmentsGrouped, 
  finishConsultation, 
  cancelledApointment, 
  addToWaitingList, 
  addToInProgress, 
  getBiologicalRequests, 
  createBiologicalRequest, 
  updateBiologicalRequest, 
  getAllAppointments, 
  getStatistics, 
  getHistory,
  getDashboardKPIs,
  returnToQueue,
<<<<<<< HEAD
  returnToAbsent
=======
  removeFromWaitingQueue,
  updateRendezVousNote
>>>>>>> f772dd4846966f60c4177aa485cd767be98191b3
} from '../controllers/medecinController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';
import { PrismaClient } from '@prisma/client';


const router = express.Router();

router.post('/create-patient', verifyAccessToken, newPatient);
router.post('/add-appointment', verifyAccessToken, newRendezVous);
router.post('/add-to-waiting', verifyAccessToken, addToWaitingList);
router.post('/return-queue', verifyAccessToken, returnToQueue);
router.post('/return-absent', verifyAccessToken, returnToAbsent);
router.post('/add-to-actif', verifyAccessToken, addToInProgress);
router.post('/finish-consultation', verifyAccessToken, finishConsultation);
router.post('/remove-from-waiting', verifyAccessToken, removeFromWaitingQueue);
router.post('/add-to-waiting-today', verifyAccessToken, addToWaitingListToday);
router.get('/list-patients', verifyAccessToken, listPatients);
router.get('/appointments', verifyAccessToken, getAllAppointments);
router.get('/statistics', verifyAccessToken, getStatistics);
router.get('/dashboard-kpis', verifyAccessToken, getDashboardKPIs);
router.get('/today-appointments', verifyAccessToken, listTodayAppointments);
router.get('/cancel-appointments', cancelledApointment)
router.get('/completed-appointments', verifyAccessToken, getCompletedAppointments);
router.get('/completed-appointments-grouped', verifyAccessToken, getCompletedAppointmentsGrouped);
router.get('/history', verifyAccessToken, getHistory);
router.get('/profile-patient/:id', verifyAccessToken, getPatientProfile)
router.get('/test', test)

// Patient management routes
router.put('/patients/:id', verifyAccessToken, updatePatient);
router.delete('/patients/:id', verifyAccessToken, deletePatient);

// Rendez-vous management routes
router.put('/rendez-vous/:rendezVousId/note', verifyAccessToken, updateRendezVousNote);

// Biological request routes
router.get('/biological-requests/:patientId', verifyAccessToken, getBiologicalRequests);
router.post('/biological-requests', verifyAccessToken, createBiologicalRequest);
router.put('/biological-requests/:requestId', verifyAccessToken, updateBiologicalRequest);


export default router;