import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from "../prisma.js";
let io = null;

/**
 * Initialize WebSocket server
 */
const doctorSockets = new Map(); // medecinId → Set of sockets

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for public display
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.medecinId = payload.userId;
      next();
    } catch (err) {
      console.log(err)
      return next(new Error("Invalid token"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    const medecinId = socket.medecinId;

    // Store socket under doctor ID
    if (!doctorSockets.has(medecinId)) {
      doctorSockets.set(medecinId, new Set());
    }
    doctorSockets.get(medecinId).add(socket);

    // Send initial waiting line data on connection
    sendWaitingLineUpdate();

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
      // Remove socket from map
      doctorSockets.get(medecinId)?.delete(socket);

      // Cleanup if empty
      if (doctorSockets.get(medecinId)?.size === 0) {
        doctorSockets.delete(medecinId);
      }
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


const getCurrentPatient = async (medecinId) => {
  try {

    const currentAppointment = await prisma.rendezVous.findFirst({
      where: {
        medecinId,
        state: "InProgress"
      },
      include: {
        patient: true
      }
    });

    const waitingLine = await prisma.rendezVous.findMany({
      where: {
        medecinId,
        state: "Waiting",
        date: currentAppointment ? currentAppointment.date : undefined
      },
      orderBy: {
        arrivalTime: "asc"
      },
      take: 3,
      include: {
        patient: true
      }
    })





    return { currentAppointment, waitingLine };

  } catch (error) {
    console.error('Error fetching current appoihntment data:', error);
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

export const sendCurrentAppointment = async (medecinId) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  if (!medecinId) {
    console.warn("medecinId missing when calling sendCurrentAppointment()");
    return;
  }

  const data = await getCurrentPatient(medecinId);

  if (!data) return;

  const sockets = doctorSockets.get(medecinId);

  if (!sockets || sockets.size === 0) {
    console.log(`No connected sockets for doctor ${medecinId}`);
    return;
  }

  for (const socket of sockets) {
    socket.emit('patientInConsultation', data);
  }

  console.log(`Sent current patient update to doctor ${medecinId}`);


};

/**
 * Trigger waiting line update (call this when appointments change)
 */
export const triggerWaitingLineUpdate = () => {
  sendWaitingLineUpdate();
};

export const triggerCurrentPatientUpdate = (medecinId) => {
  sendCurrentAppointment(medecinId);
};

/**
 * Get WebSocket instance
 */
export const getIO = () => io;
