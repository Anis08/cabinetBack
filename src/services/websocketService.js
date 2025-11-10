import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let io = null;

/**
 * Initialize WebSocket server
 */
export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for public display
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    // Send initial waiting line data on connection
    sendWaitingLineUpdate();

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });

    // Handle manual refresh request
    socket.on('refresh-waiting-line', () => {
      sendWaitingLineUpdate();
    });
  });

  console.log('WebSocket server initialized');
  return io;
};

/**
 * Get current waiting line data
 */
const getWaitingLineData = async () => {
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
    const waiting = waitingAppointments.map((apt, index) => ({
      id: apt.id,
      name: apt.patient.fullName,
      fullName: apt.patient.fullName,
      appointmentTime: apt.arrivalTime || apt.date,
      patientId: apt.patient.id,
      position: index + 1
    }));

    return {
      current,
      waiting,
      totalWaiting: waiting.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching waiting line data:', error);
    return null;
  }
};

/**
 * Send waiting line update to all connected clients
 */
export const sendWaitingLineUpdate = async () => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  const data = await getWaitingLineData();
  
  if (data) {
    io.emit('waiting-line-update', data);
    console.log(`Waiting line update sent: ${data.totalWaiting} waiting, current: ${data.current ? data.current.name : 'none'}`);
  }
};

/**
 * Trigger waiting line update (call this when appointments change)
 */
export const triggerWaitingLineUpdate = () => {
  sendWaitingLineUpdate();
};

/**
 * Get WebSocket instance
 */
export const getIO = () => io;
