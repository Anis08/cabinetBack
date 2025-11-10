import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get current public waiting line status
 * Returns the current patient in consultation and waiting patients
 */
export const getWaitingLine = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current patient (InProgress)
    const currentAppointment = await prisma.rendezVous.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        state: 'InProgress'
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Get waiting patients (Waiting status)
    const waitingAppointments = await prisma.rendezVous.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        state: 'Waiting'
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: [
        { arrivalTime: 'asc' },
        { date: 'asc' }
      ]
    });

    // Format current patient
    const current = currentAppointment ? {
      id: currentAppointment.id,
      name: currentAppointment.patient.fullName,
      fullName: currentAppointment.patient.fullName,
      appointmentTime: currentAppointment.startTime || currentAppointment.arrivalTime,
      patientId: currentAppointment.patient.id
    } : null;

    // Format waiting patients
    const waiting = waitingAppointments.map(apt => ({
      id: apt.id,
      name: apt.patient.fullName,
      fullName: apt.patient.fullName,
      appointmentTime: apt.arrivalTime || apt.date,
      patientId: apt.patient.id,
      position: waitingAppointments.indexOf(apt) + 1
    }));

    res.status(200).json({
      current,
      waiting,
      totalWaiting: waiting.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching waiting line:', error);
    res.status(500).json({ 
      message: 'Failed to fetch waiting line', 
      error: error.message 
    });
  }
};

/**
 * Get waiting line statistics
 * Returns metrics about today's waiting line
 */
export const getWaitingLineStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all appointments for today
    const appointments = await prisma.rendezVous.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const stats = {
      total: appointments.length,
      waiting: appointments.filter(a => a.state === 'Waiting').length,
      inProgress: appointments.filter(a => a.state === 'InProgress').length,
      completed: appointments.filter(a => a.state === 'Completed').length,
      cancelled: appointments.filter(a => a.state === 'Cancelled').length,
      scheduled: appointments.filter(a => a.state === 'Scheduled').length,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching waiting line stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics', 
      error: error.message 
    });
  }
};
