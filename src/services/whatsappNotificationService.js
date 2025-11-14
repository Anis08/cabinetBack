import twilio from 'twilio';
import cron from 'node-cron';
import prisma from '../prisma.js';

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+14155238886

let twilioClient = null;

// Initialize Twilio client
const initializeTwilio = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.warn('⚠️  Twilio credentials not configured. WhatsApp notifications disabled.');
    console.warn('   Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env');
    return null;
  }

  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio WhatsApp client initialized');
    return twilioClient;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    return null;
  }
};

// Format phone number for WhatsApp (add country code if needed)
const formatPhoneNumber = (phoneNumber) => {
  // Remove spaces and special characters
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    // Assume Moroccan number if no country code
    if (cleaned.startsWith('0')) {
      cleaned = '+212' + cleaned.substring(1);
    } else if (cleaned.startsWith('212')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+212' + cleaned;
    }
  }
  
  return `whatsapp:${cleaned}`;
};

// Generate message template
const generateAppointmentMessage = (patient, appointment, medecin) => {
  const appointmentDate = new Date(appointment.date);
  const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeStr = appointment.startTime || 'à confirmer';
  
  return `🏥 *Rappel de Rendez-vous*

Bonjour ${patient.fullName},

Ceci est un rappel pour votre rendez-vous chez ${medecin.fullName || 'Dr. ' + medecin.fullName}.

📅 Date: ${dateStr}
⏰ Heure: ${timeStr}
💰 Tarif: ${medecin.price || '50'}DH

Merci de confirmer votre présence ou de nous contacter pour tout changement.

À demain! 👋`;
};

// Send WhatsApp message
export const sendWhatsAppMessage = async (to, message) => {
  if (!twilioClient) {
    console.log('⚠️  Twilio not configured. Skipping WhatsApp message.');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const formattedNumber = formatPhoneNumber(to);
    
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: message
    });

    console.log(`✅ WhatsApp message sent to ${to}:`, result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send appointment reminder
export const sendAppointmentReminder = async (appointmentId) => {
  try {
    // Fetch appointment with patient and medecin info
    const appointment = await prisma.rendezVous.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true
          }
        },
        medecin: {
          select: {
            id: true,
            fullName: true,
            price: true
          }
        }
      }
    });

    if (!appointment) {
      console.error(`❌ Appointment ${appointmentId} not found`);
      return { success: false, error: 'Appointment not found' };
    }

    if (!appointment.patient.phoneNumber) {
      console.warn(`⚠️  No phone number for patient ${appointment.patient.fullName}`);
      return { success: false, error: 'No phone number' };
    }

    // Generate message
    const message = generateAppointmentMessage(
      appointment.patient,
      appointment,
      appointment.medecin
    );

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(
      appointment.patient.phoneNumber,
      message
    );

    if (result.success) {
      // Update appointment to mark notification sent
      await prisma.rendezVous.update({
        where: { id: appointmentId },
        data: {
          // You can add a field like 'reminderSent: true' if you add it to schema
          note: appointment.note 
            ? `${appointment.note}\n[Rappel WhatsApp envoyé le ${new Date().toLocaleString('fr-FR')}]`
            : `[Rappel WhatsApp envoyé le ${new Date().toLocaleString('fr-FR')}]`
        }
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Error sending appointment reminder:', error.message);
    return { success: false, error: error.message };
  }
};

// Check and send reminders for tomorrow's appointments
export const checkAndSendReminders = async () => {
  try {
    console.log('🔍 Checking for appointments to remind...');

    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find all appointments for tomorrow that are Scheduled
    const appointments = await prisma.rendezVous.findMany({
      where: {
        date: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        state: 'Scheduled',
        // Optional: Add a field to track if reminder was sent
        // reminderSent: false
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true
          }
        },
        medecin: {
          select: {
            id: true,
            fullName: true,
            price: true
          }
        }
      }
    });

    console.log(`📋 Found ${appointments.length} appointments for tomorrow`);

    if (appointments.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    const results = {
      success: true,
      sent: 0,
      failed: 0,
      details: []
    };

    // Send reminders
    for (const appointment of appointments) {
      // Check if patient has phone number
      if (!appointment.patient.phoneNumber) {
        console.warn(`⚠️  Skipping appointment ${appointment.id} - no phone number`);
        results.failed++;
        results.details.push({
          appointmentId: appointment.id,
          patient: appointment.patient.fullName,
          error: 'No phone number'
        });
        continue;
      }

      // Check if reminder already sent (check note field)
      if (appointment.note && appointment.note.includes('[Rappel WhatsApp envoyé')) {
        console.log(`ℹ️  Reminder already sent for appointment ${appointment.id}`);
        continue;
      }

      // Send reminder
      const result = await sendAppointmentReminder(appointment.id);

      if (result.success) {
        results.sent++;
        results.details.push({
          appointmentId: appointment.id,
          patient: appointment.patient.fullName,
          phone: appointment.patient.phoneNumber,
          messageId: result.messageId
        });
      } else {
        results.failed++;
        results.details.push({
          appointmentId: appointment.id,
          patient: appointment.patient.fullName,
          error: result.error
        });
      }

      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Reminders sent: ${results.sent}, Failed: ${results.failed}`);
    return results;
  } catch (error) {
    console.error('❌ Error in checkAndSendReminders:', error.message);
    return { success: false, error: error.message };
  }
};

// Schedule cron job to run every day at 9 AM
export const startReminderScheduler = () => {
  console.log('🕐 Starting WhatsApp reminder scheduler...');

  // Initialize Twilio
  initializeTwilio();

  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running scheduled reminder check at', new Date().toLocaleString('fr-FR'));
    await checkAndSendReminders();
  }, {
    timezone: "Africa/Casablanca"
  });

  console.log('✅ Reminder scheduler started (runs daily at 9:00 AM)');

  // Optional: Also run at 6 PM for double reminder
  cron.schedule('0 18 * * *', async () => {
    console.log('⏰ Running evening reminder check at', new Date().toLocaleString('fr-FR'));
    await checkAndSendReminders();
  }, {
    timezone: "Africa/Casablanca"
  });

  console.log('✅ Evening reminder scheduler started (runs daily at 6:00 PM)');
};

// Manual trigger endpoint (for testing)
export const triggerManualReminder = async () => {
  console.log('🔄 Manual reminder trigger requested');
  return await checkAndSendReminders();
};

export default {
  startReminderScheduler,
  sendAppointmentReminder,
  sendWhatsAppMessage,
  checkAndSendReminders,
  triggerManualReminder
};
