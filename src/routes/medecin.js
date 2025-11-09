import express from 'express';
import { newPatient, listPatients, newRendezVous, test, listTodayAppointments, getPatientProfile, addToWaitingListToday, getCompletedAppointments, finishConsultation, cancelledApointment, addToWaitingList, addToInProgress, getBiologicalRequests, createBiologicalRequest, updateBiologicalRequest } from '../controllers/medecinController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';
import { PrismaClient } from '@prisma/client';


const router = express.Router();

router.post('/create-patient', verifyAccessToken, newPatient);
router.post('/add-appointment', verifyAccessToken, newRendezVous);
router.post('/add-to-waiting', verifyAccessToken, addToWaitingList);
router.post('/add-to-actif', verifyAccessToken, addToInProgress);
router.post('/finish-consultation', verifyAccessToken, finishConsultation);
router.post('/add-to-waiting-today', verifyAccessToken, addToWaitingListToday);
router.get('/list-patients', verifyAccessToken, listPatients);
router.get('/today-appointments', verifyAccessToken, listTodayAppointments);
router.get('/cancel-appointments', cancelledApointment)
router.get('/completed-appointments', verifyAccessToken, getCompletedAppointments);
router.get('/profile-patient/:id', verifyAccessToken, getPatientProfile)
router.get('/test', test)

// Biological request routes
router.get('/biological-requests/:patientId', verifyAccessToken, getBiologicalRequests);
router.post('/biological-requests', verifyAccessToken, createBiologicalRequest);
router.put('/biological-requests/:requestId', verifyAccessToken, updateBiologicalRequest);


export default router;