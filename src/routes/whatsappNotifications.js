import express from 'express';
import { 
  triggerManualReminder,
  sendAppointmentReminder,
  checkAndSendReminders
} from '../services/whatsappNotificationService.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

// Manual trigger for testing (send reminders now)
router.post('/trigger-reminders', verifyAccessToken, async (req, res) => {
  try {
    console.log('📨 Manual reminder trigger requested by medecin:', req.medecinId);
    
    const result = await triggerManualReminder();
    
    res.status(200).json({
      message: 'Reminders processed',
      result
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    res.status(500).json({
      message: 'Failed to trigger reminders',
      error: error.message
    });
  }
});

// Send reminder for specific appointment
router.post('/send-reminder/:appointmentId', verifyAccessToken, async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    
    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    console.log(`📨 Sending reminder for appointment ${appointmentId}`);
    
    const result = await sendAppointmentReminder(appointmentId);
    
    if (result.success) {
      res.status(200).json({
        message: 'Reminder sent successfully',
        result
      });
    } else {
      res.status(400).json({
        message: 'Failed to send reminder',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      message: 'Failed to send reminder',
      error: error.message
    });
  }
});

// Get reminder status/stats
router.get('/stats', verifyAccessToken, async (req, res) => {
  try {
    // This could be expanded to track sent reminders in a separate table
    res.status(200).json({
      message: 'WhatsApp notification system active',
      schedule: [
        'Daily at 9:00 AM (Morocco time)',
        'Daily at 6:00 PM (Morocco time)'
      ],
      info: 'Reminders are sent 24 hours before scheduled appointments'
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

export default router;
