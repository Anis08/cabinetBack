import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all complementary exams for a patient
export const getComplementaryExams = async (req, res) => {
  const medecinId = req.medecinId;
  const patientId = req.params.patientId;

  try {
    // Verify that patient belongs to this medecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId: medecinId
      }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or does not belong to this doctor' });
    }

    // Get all exams for this patient
    const exams = await prisma.complementaryExam.findMany({
      where: {
        patientId: parseInt(patientId)
      },
      include: {
        files: {
          orderBy: {
            uploadDate: 'desc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({ 
      exams: exams 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get complementary exams', error: err.message });
    console.error(err);
  }
};

// Create a new complementary exam
export const createComplementaryExam = async (req, res) => {
  const medecinId = req.medecinId;
  const { patientId, type, description, date } = req.body;

  try {
    // Validate required fields
    if (!patientId || !type || !description || !date) {
      return res.status(400).json({ message: 'Patient ID, type, description, and date are required' });
    }

    // Verify that patient belongs to this medecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId: medecinId
      }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or does not belong to this doctor' });
    }

    // Create exam
    const exam = await prisma.complementaryExam.create({
      data: {
        patientId: parseInt(patientId),
        type,
        description,
        date: new Date(date)
      },
      include: {
        files: true
      }
    });

    res.status(201).json({ 
      message: 'Complementary exam created successfully',
      exam: exam 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create complementary exam', error: err.message });
    console.error(err);
  }
};

// Update a complementary exam
export const updateComplementaryExam = async (req, res) => {
  const medecinId = req.medecinId;
  const examId = req.params.examId;
  const { type, description, date } = req.body;

  try {
    // Verify that exam exists and belongs to a patient of this medecin
    const existingExam = await prisma.complementaryExam.findFirst({
      where: {
        id: parseInt(examId),
        patient: {
          medecinId: medecinId
        }
      }
    });

    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found or does not belong to your patient' });
    }

    // Update exam
    const updatedExam = await prisma.complementaryExam.update({
      where: {
        id: parseInt(examId)
      },
      data: {
        type: type || existingExam.type,
        description: description || existingExam.description,
        date: date ? new Date(date) : existingExam.date
      },
      include: {
        files: true
      }
    });

    res.status(200).json({ 
      message: 'Complementary exam updated successfully',
      exam: updatedExam 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update complementary exam', error: err.message });
    console.error(err);
  }
};

// Delete a complementary exam
export const deleteComplementaryExam = async (req, res) => {
  const medecinId = req.medecinId;
  const examId = req.params.examId;

  try {
    // Verify that exam exists and belongs to a patient of this medecin
    const existingExam = await prisma.complementaryExam.findFirst({
      where: {
        id: parseInt(examId),
        patient: {
          medecinId: medecinId
        }
      },
      include: {
        files: true
      }
    });

    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found or does not belong to your patient' });
    }

    // Delete associated files from filesystem
    for (const file of existingExam.files) {
      try {
        const filePath = path.join(__dirname, '../../', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Error deleting file:', fileErr);
        // Continue deletion even if file removal fails
      }
    }

    // Delete exam (CASCADE will delete related files from DB)
    await prisma.complementaryExam.delete({
      where: {
        id: parseInt(examId)
      }
    });

    res.status(200).json({ 
      message: 'Complementary exam deleted successfully',
      examId: parseInt(examId)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete complementary exam', error: err.message });
    console.error(err);
  }
};

// Upload file for an exam
export const uploadExamFile = async (req, res) => {
  const medecinId = req.medecinId;
  const examId = req.params.examId;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify that exam exists and belongs to a patient of this medecin
    const existingExam = await prisma.complementaryExam.findFirst({
      where: {
        id: parseInt(examId),
        patient: {
          medecinId: medecinId
        }
      }
    });

    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found or does not belong to your patient' });
    }

    // Create file record
    const examFile = await prisma.examFile.create({
      data: {
        examId: parseInt(examId),
        fileName: req.file.originalname,
        fileUrl: `uploads/exams/${req.file.filename}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
    });

    res.status(201).json({ 
      message: 'File uploaded successfully',
      file: examFile 
    });
  } catch (err) {
    // Delete uploaded file if database operation fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fileErr) {
        console.error('Error deleting uploaded file:', fileErr);
      }
    }
    res.status(500).json({ message: 'Failed to upload file', error: err.message });
    console.error(err);
  }
};

// Delete a file from an exam
export const deleteExamFile = async (req, res) => {
  const medecinId = req.medecinId;
  const fileId = req.params.fileId;

  try {
    // Verify that file exists and belongs to an exam of a patient of this medecin
    const existingFile = await prisma.examFile.findFirst({
      where: {
        id: parseInt(fileId),
        exam: {
          patient: {
            medecinId: medecinId
          }
        }
      }
    });

    if (!existingFile) {
      return res.status(404).json({ message: 'File not found or does not belong to your patient' });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(__dirname, '../../', existingFile.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.error('Error deleting file from filesystem:', fileErr);
      // Continue with database deletion even if file removal fails
    }

    // Delete file record from database
    await prisma.examFile.delete({
      where: {
        id: parseInt(fileId)
      }
    });

    res.status(200).json({ 
      message: 'File deleted successfully',
      fileId: parseInt(fileId)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete file', error: err.message });
    console.error(err);
  }
};
