import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "../prisma.js";
import { startOfDay } from 'date-fns';
import { da } from 'date-fns/locale';



export const newPatient = async (req, res) => {
  const medecinId = req.medecinId
  const { fullName, phoneNumber, gender, poids, taille, dateOfBirth, bio, maladieChronique } = req.body;
  try {
    if (!fullName || !phoneNumber || !gender || !dateOfBirth || !bio || !maladieChronique) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const patient = await prisma.patient.create({
      data: {
        fullName,
        phoneNumber,
        gender,
        poids: parseFloat(poids),
        taille: parseInt(taille),
        dateOfBirth: new Date(dateOfBirth),
        bio,
        maladieChronique,
        medecinId,
      }, 
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        gender: true,
        poids: true,
        taille: true,
        dateOfBirth: true,
        bio: true,
        maladieChronique: true,
        createdAt: true,
        rendezVous: {
          take: 1,
          where: { state: 'Completed' },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })


    res.status(200).json({ patient });
  } catch (err) {

    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Patient with this phone number already exists' });
    }
    res.status(500).json({ message: 'Failed to create a patient', error: err.message });
    console.error(err);
  }
}

export const listPatients = async (req, res) => {
  const medecinId = req.medecinId;
  try {
    const patients = await prisma.patient.findMany({
      where: {
        medecinId: medecinId
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        gender: true,
        poids: true,
        taille: true,
        dateOfBirth: true,
        bio: true,
        maladieChronique: true,
        createdAt: true,
        rendezVous: {
          take: 1,
          where: { state: 'Completed' },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (patients.length === 0) {
      return res.status(404).json({ message: 'No patients found' });
    }

    // Calculate average age
    const today = new Date();
    const ages = patients.map(p => {
      const dob = new Date(p.dateOfBirth);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    });
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    // Number of new patients this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const newPatientsThisMonth = patients.filter(p => new Date(p.createdAt) >= monthStart).length;

    // Number of patients viewed (had a completed appointment) this week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const patientsViewedThisWeek = await prisma.rendezVous.findMany({
      where: {
        medecinId,
        state: 'Completed',
        date: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      select: { patientId: true }
    });
    const uniquePatientsViewedThisWeek = new Set(patientsViewedThisWeek.map(r => r.patientId)).size;

    res.status(200).json({
      patients,
      averageAge,
      newPatientsThisMonth,
      patientsViewedThisWeek: uniquePatientsViewedThisWeek
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list patients', error: err.message });
    console.error(err);
  }
}


export const newRendezVous = async (req, res) => {
  const medecinId = req.medecinId
  const { dateDeRendezVous, patientId } = req.body;
  try {
    if (!dateDeRendezVous || !patientId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const dateDeRendezVousObj = new Date(dateDeRendezVous);
    const date = dateDeRendezVousObj.toISOString().split('T')[0];


    const rendezVous = await prisma.rendezVous.create({
      data: {
        date: new Date(date),
        patientId,
        medecinId
      }
    })


    res.status(200).json({ rendezVous });
  } catch (err) {

    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Un rendez-vous identique existe déjà' });
    }
    res.status(500).json({ message: 'Failed to create an appointment', error: err.message });
    console.error(err);
  }
}


export const test = async (req, res) => {

  const todayRendezVous = await prisma.rendezVous.findMany({
    where: {
      date: new Date(new Date().toISOString().split('T')[0]),
    }
  });

  const weeksRendezVous = await prisma.rendezVous.findMany({
    where: {
      date: {
        gte: new Date(new Date().toISOString().split('T')[0]),
        lte: new Date(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0]),
      }
    }
  });

  res.status(200).json({ todayRendezVous, weeksRendezVous });
}


export const listTodayAppointments = async (req, res) => {
  const medecinId = req.medecinId;
  try {
    const todayAppointments = await prisma.rendezVous.findMany({
      where: {
        AND: [
          { medecinId: medecinId },
          { date: new Date(new Date().toISOString().split('T')[0]) }
        ]
      },
      include: {
        patient: true
      }
    });

    if (todayAppointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found' });
    }
    res.status(200).json({ todayAppointments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list patients', error: err.message });
    console.error(err);
  }
}


export const addToWaitingList = async (req, res) => {
  const medecinId = req.medecinId
  const { rendezVousId } = req.body;
  try {
    if (!rendezVousId) {
      return res.status(400).json({ message: 'All fields are required' });
    }



    const rendezVous = await prisma.rendezVous.findUnique({
      where: {
        id: rendezVousId,

      }
    })


    if (!rendezVous || rendezVous.state !== 'Scheduled') {
      return res.status(404).json({ message: 'Rendez-vous not found' });

    }

    if (new Date(rendezVous.date).toISOString() !== new Date().toISOString().split('T')[0] + "T00:00:00.000Z") {
      return res.status(404).json({ message: 'Only today\'s appointments can be added to the waiting list' });
    }


    await prisma.rendezVous.update({
      where: {
        id: rendezVousId,
      },
      data: {
        state: 'Waiting',
        arrivalTime: new Date(),
      }

    })

    res.status(200).json({ state: 'Waiting' });
  } catch (err) {

    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Un rendez-vous identique existe déjà' });
    }
    res.status(500).json({ message: 'Failed to create an appointment', error: err.message });
    console.error(err);
  }
}


export const addToInProgress = async (req, res) => {
  const medecinId = req.medecinId
  const { rendezVousId } = req.body;
  try {
    if (!rendezVousId) {
      return res.status(400).json({ message: 'All fields are required' });
    }



    const rendezVous = await prisma.rendezVous.findUnique({
      where: {
        id: rendezVousId,

      }
    })


    if (!rendezVous || rendezVous.state !== 'Waiting') {
      return res.status(404).json({ message: 'Rendez-vous not found' });

    }

    if (new Date(rendezVous.date).toISOString() !== new Date().toISOString().split('T')[0] + "T00:00:00.000Z") {
      return res.status(404).json({ message: 'Only today\'s appointments can be added to the in progress' });
    }


    await prisma.rendezVous.update({
      where: {
        id: rendezVousId,
      },
      data: {
        state: 'InProgress',
        startTime: new Date(),
      }

    })

    res.status(200).json({ state: 'InProgress' });
  } catch (err) {

    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Un patient est deja en consultation' });
    }
    res.status(500).json({ message: 'Failed to create an appointment', error: err.message });
    console.error(err);
  }
}



export const cancelledApointment = async (req, res) => {

  await prisma.rendezVous.updateMany({
    where: {
      date: {
        lt: new Date(new Date().toISOString().split('T')[0])
      },
      state: 'Scheduled'
    },
    data: {
      state: 'Cancelled',
    },
  });

  res.status(200).json({ message: 'Old appointments updated to Done' });

}


export const finishConsultation = async (req, res) => {
  const medecinId = req.medecinId
  const { rendezVousId, paye, note, poids, prochainRdv, pcm, imc, pulse, paSystolique, paDiastolique } = req.body;

  try {
    if (!rendezVousId || paye == null || !medecinId) {
      console.log(rendezVousId, paye, medecinId);
      return res.status(400).json({ message: 'All fields are required' });
    }

    const rendezVous = await prisma.rendezVous.findUnique({
      where: {
        id: rendezVousId,
      }
    });

    if (!rendezVous || rendezVous.state !== 'InProgress' || rendezVous.medecinId !== medecinId) {
      return res.status(404).json({ message: 'Rendez-vous not found' });
    }

    if (new Date(rendezVous.date).toISOString() !== new Date().toISOString().split('T')[0] + "T00:00:00.000Z") {
      return res.status(404).json({ message: 'Only today\'s appointments can be finished' });
    }

    const completed = await prisma.rendezVous.update({
      where: {
        id: rendezVousId,
      },
      data: {
        state: 'Completed',
        endTime: new Date(),
        paid: parseInt(paye),
        note: note || null,
        poids: poids ? parseFloat(poids) : null,
        pcm: pcm ? parseFloat(pcm) : null,
        imc: imc ? parseFloat(imc) : null,
        pulse: pulse ? parseInt(pulse) : null,
        paSystolique: paSystolique ? parseInt(paSystolique) : null,
        paDiastolique: paDiastolique ? parseInt(paDiastolique) : null,
      },
      select: {
          id: true,
          startTime: true,
          endTime: true,
          date: true,
          paid: true,
          patient: {
            select: {
              fullName: true,
              maladieChronique: true,
            }
          }
        }
    });


    if (prochainRdv) {
      const dateDeRendezVousObj = new Date(prochainRdv);
      const date = dateDeRendezVousObj.toISOString().split('T')[0];
      const prochainRdvDate = new Date(prochainRdv);
      // Check if date is valid
      if (isNaN(prochainRdvDate.getTime())) {
        return res.status(400).json({ message: 'prochainRdv is not a valid date' });
      }
      // Check if date is today or in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      prochainRdvDate.setHours(0, 0, 0, 0);
      if (prochainRdvDate < today) {
        return res.status(400).json({ message: 'prochainRdv must be today or in the future' });
      }
      console.log(date);
      const newRendezVous = await prisma.rendezVous.create({
        data: {
          date: new Date(date),
          patientId: rendezVous.patientId,
          medecinId
        }
      });

    }

    res.status(200).json({ message: 'Consultation finished', completed });

  }
  catch (err) {
    res.status(500).json({ message: 'Failed to finish consultation', error: err.message });
    console.error(err);
  }
}



export const getCompletedAppointments = async (req, res) => {
  const medecinId = req.medecinId;
  try {
    // Prepare date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Run all queries in parallel
    const [
      completedApointments,
      todayRevenue,
      weekRevenue,
      avgPaid
    ] = await Promise.all([
      prisma.rendezVous.findMany({
        where: {
          AND: [
            { medecinId: medecinId },
            { state: 'Completed' }
          ]
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          date: true,
          paid: true,
          patient: {
            select: {
              fullName: true,
              maladieChronique: true,
            }
          }
        }
      }),
      prisma.rendezVous.aggregate({
        _sum: { paid: true },
        where: {
          medecinId,
          state: 'Completed',
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.rendezVous.aggregate({
        _sum: { paid: true },
        where: {
          medecinId,
          state: 'Completed',
          date: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      }),
      prisma.rendezVous.aggregate({
        _avg: { paid: true },
        where: {
          medecinId,
          state: 'Completed'
        }
      })
    ]);

    if (completedApointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found' });
    }

    res.status(200).json({
      completedApointments,
      todayRevenue: todayRevenue._sum.paid || 0,
      weekRevenue: weekRevenue._sum.paid || 0,
      averagePaid: Math.round(avgPaid._avg.paid) || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list patients', error: err.message });
    console.error(err);
  }
}


export const addToWaitingListToday = async (req, res) =>  {
  const medecinId = req.medecinId;
  const { patientId } = req.body;
  try {
    if (!patientId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const rendezVous = await prisma.rendezVous.create(
      {
        data: {
          date: new Date(new Date().toISOString().split('T')[0]),
          patientId,
          medecinId,
          state: 'Waiting',
          arrivalTime: new Date(),
        },
        include: {
          patient: true,
        }
      }
    )

    res.status(200).json({ rendezVous });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Un rendez-vous identique existe deja' });
    }
    res.status(500).json({ message: 'Failed to add to waiting list', error: err.message });
    console.error(err);
  }
}


export const getPatientProfile = async (req, res) => {
  const medecinId = req.medecinId;
  const patientId = req.params.id;
  try {

    const [patient, nextAppointment] = await prisma.$transaction([
      prisma.patient.findUnique({
      where: {
        id: parseInt(patientId)
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        gender: true,
        poids: true,
        taille: true,
        dateOfBirth: true,
        bio: true,
        maladieChronique: true,
        createdAt: true,
        rendezVous: {
          where: { state: 'Completed' },
          orderBy: {
            date: 'desc'
          }
        }
      }
    }),
    prisma.rendezVous.findFirst({
      where: {
        patientId: parseInt(patientId),
        medecinId,
        state: { in: ['Scheduled', 'Waiting', 'InProgress']},
      },
      orderBy:{
        date: 'asc'
      }
    })
  ])

    if (!patient) {
      return res.status(404).json({ message: 'No patients found' });
    }

 

    res.status(200).json({
      patient, nextAppointment
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list patients', error: err.message });
    console.error(err);
  }
}


// Get all biological requests for a patient
export const getBiologicalRequests = async (req, res) => {
  const medecinId = req.medecinId;
  const patientId = req.params.patientId;

  try {
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Verify that the patient belongs to this medecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId: medecinId
      }
    });

    if (!patient) {
      return res.status(403).json({ message: 'Access denied: Patient does not belong to this medecin' });
    }

    const requests = await prisma.biologicalRequest.findMany({
      where: {
        patientId: parseInt(patientId),
        medecinId: medecinId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map enum values to match frontend expectations
    const formattedRequests = requests.map(request => ({
      ...request,
      status: request.status === 'EnCours' ? 'En cours' : 'Complété'
    }));

    res.status(200).json({ requests: formattedRequests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve biological requests', error: err.message });
    console.error(err);
  }
};


// Create a new biological request
export const createBiologicalRequest = async (req, res) => {
  const medecinId = req.medecinId;
  const { patientId, sampleTypes, requestedExams, status } = req.body;

  try {
    if (!patientId || !sampleTypes || !requestedExams || sampleTypes.length === 0 || requestedExams.length === 0) {
      return res.status(400).json({ message: 'Patient ID, sample types, and requested exams are required' });
    }

    // Verify that the patient belongs to this medecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId: medecinId
      }
    });

    if (!patient) {
      return res.status(403).json({ message: 'Access denied: Patient does not belong to this medecin' });
    }

    // Map status from frontend to enum
    const dbStatus = status === 'Complété' ? 'Completed' : 'EnCours';

    const biologicalRequest = await prisma.biologicalRequest.create({
      data: {
        patientId: parseInt(patientId),
        medecinId: medecinId,
        sampleTypes: sampleTypes,
        requestedExams: requestedExams,
        status: dbStatus,
        results: {}
      }
    });

    // Format response to match frontend expectations
    const formattedRequest = {
      ...biologicalRequest,
      status: biologicalRequest.status === 'EnCours' ? 'En cours' : 'Complété'
    };

    res.status(201).json({ request: formattedRequest, message: 'Biological request created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create biological request', error: err.message });
    console.error(err);
  }
};


// Update biological request results
export const updateBiologicalRequest = async (req, res) => {
  const medecinId = req.medecinId;
  const requestId = req.params.requestId;
  const { patientId, results, status, samplingDate } = req.body;

  try {
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    // Verify that the request exists and belongs to this medecin
    const existingRequest = await prisma.biologicalRequest.findFirst({
      where: {
        id: parseInt(requestId),
        medecinId: medecinId
      }
    });

    if (!existingRequest) {
      return res.status(404).json({ message: 'Biological request not found or access denied' });
    }

    // Verify patient ownership if patientId is provided
    if (patientId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: parseInt(patientId),
          medecinId: medecinId
        }
      });

      if (!patient) {
        return res.status(403).json({ message: 'Access denied: Patient does not belong to this medecin' });
      }
    }

    // Map status from frontend to enum
    const dbStatus = status === 'Complété' ? 'Completed' : 'EnCours';

    // Prepare update data
    const updateData = {};
    if (results !== undefined) updateData.results = results;
    if (status !== undefined) updateData.status = dbStatus;
    if (samplingDate !== undefined) updateData.samplingDate = samplingDate ? new Date(samplingDate) : null;

    const updatedRequest = await prisma.biologicalRequest.update({
      where: {
        id: parseInt(requestId)
      },
      data: updateData
    });

    // Format response to match frontend expectations
    const formattedRequest = {
      ...updatedRequest,
      status: updatedRequest.status === 'EnCours' ? 'En cours' : 'Complété'
    };

    res.status(200).json({ request: formattedRequest, message: 'Biological request updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update biological request', error: err.message });
    console.error(err);
  }
};