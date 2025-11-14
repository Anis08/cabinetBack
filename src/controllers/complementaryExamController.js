import { PrismaClient } from '@prisma/client';
import { uploadExamsToGoogleDrive, deleteFromGoogleDrive } from '../services/googleDriveService.js';
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
      return res.status(404).json({ message: 'Patient non trouvé ou n\'appartient pas à ce médecin' });
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

    // Calculate statistics
    const stats = {
      total: exams.length,
      totalFiles: exams.reduce((sum, exam) => sum + exam.files.length, 0),
      types: [...new Set(exams.map(e => e.type))],
      recentExams: exams.filter(e => {
        const examDate = new Date(e.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return examDate >= monthAgo;
      }).length
    };

    res.status(200).json({ 
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender
      },
      exams,
      stats,
      message: 'Examens récupérés avec succès'
    });
  } catch (err) {
    console.error('Error fetching exams:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des examens', 
      error: err.message 
    });
  }
};

// Get a single complementary exam by ID
export const getComplementaryExamById = async (req, res) => {
  const medecinId = req.medecinId;
  const examId = req.params.examId;

  try {
    const exam = await prisma.complementaryExam.findFirst({
      where: {
        id: parseInt(examId),
        patient: {
          medecinId: medecinId
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true
          }
        },
        files: {
          orderBy: {
            uploadDate: 'desc'
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ 
        message: 'Examen non trouvé ou n\'appartient pas à votre patient' 
      });
    }

    res.status(200).json({ exam });
  } catch (err) {
    console.error('Error fetching exam:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'examen', 
      error: err.message 
    });
  }
};

// Create a new complementary exam
export const createComplementaryExam = async (req, res) => {
  const medecinId = req.medecinId;
  const { patientId, type, description, date } = req.body;

  try {
    // Validate required fields
    if (!patientId || !type || !description || !date) {
      return res.status(400).json({ 
        message: 'Patient ID, type, description et date sont requis' 
      });
    }

    // Verify that patient belongs to this medecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId: medecinId
      }
    });

    if (!patient) {
      return res.status(404).json({ 
        message: 'Patient non trouvé ou n\'appartient pas à ce médecin' 
      });
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
        patient: {
          select: {
            id: true,
            fullName: true
          }
        },
        files: true
      }
    });

    res.status(201).json({ 
      message: 'Examen complémentaire créé avec succès',
      exam: exam 
    });
  } catch (err) {
    console.error('Error creating exam:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'examen', 
      error: err.message 
    });
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
      return res.status(404).json({ 
        message: 'Examen non trouvé ou n\'appartient pas à votre patient' 
      });
    }

    // Prepare update data
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);

    // Update exam
    const updatedExam = await prisma.complementaryExam.update({
      where: {
        id: parseInt(examId)
      },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true
          }
        },
        files: {
          orderBy: {
            uploadDate: 'desc'
          }
        }
      }
    });

    res.status(200).json({ 
      message: 'Examen complémentaire modifié avec succès',
      exam: updatedExam 
    });
  } catch (err) {
    console.error('Error updating exam:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la modification de l\'examen', 
      error: err.message 
    });
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
      return res.status(404).json({ 
        message: 'Examen non trouvé ou n\'appartient pas à votre patient' 
      });
    }

    // Delete associated files from filesystem
    let filesDeleted = 0;
    for (const file of existingExam.files) {
      try {
        const filePath = path.join(__dirname, '../../', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          filesDeleted++;
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
      message: 'Examen complémentaire supprimé avec succès',
      examId: parseInt(examId),
      filesDeleted: filesDeleted
    });
  } catch (err) {
    console.error('Error deleting exam:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'examen', 
      error: err.message 
    });
  }
};

export const uploadAdFile = async (req, res) => {
  try {
    
    res.status(200).json({
      message: 'File uploaded successfully to Google Drive',
      url: id, //store the id of the url to build it in the front end
      fileId: uploadResult.fileId,
      directLink: uploadResult.directLink,
      webViewLink: uploadResult.webViewLink,
      filename: uniqueFileName,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      message: 'Failed to upload file to Google Drive',
      error: error.message
    });
  }
};

// Upload file for an exam
export const uploadExamFile = async (req, res) => {
  const medecinId = req.medecinId;
  const examId = req.params.examId;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFileName = `exam-${timestamp}-${randomStr}${fileExtension}`;

    // Upload to Google Drive
    const uploadResult = await uploadExamsToGoogleDrive(
      req.file.buffer,
      uniqueFileName,
      req.file.mimetype
    );

    const id = new URL(uploadResult.url).searchParams.get('id');

    // Verify that exam exists and belongs to a patient of this medecin
    const existingExam = await prisma.complementaryExam.findFirst({
      where: {
        id: parseInt(examId),
        patient: {
          medecinId: medecinId
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!existingExam) {
      // Delete uploaded file if exam not found
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (fileErr) {
          console.error('Error deleting uploaded file:', fileErr);
        }
      }
      return res.status(404).json({ 
        message: 'Examen non trouvé ou n\'appartient pas à votre patient' 
      });
    }

    // Create file record
    const examFile = await prisma.examFile.create({
      data: {
        examId: parseInt(examId),
        fileName: req.file.originalname,
        fileUrl: id,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
    });

    res.status(201).json({ 
      message: 'Fichier uploadé avec succès',
      file: examFile,
      exam: {
        id: existingExam.id,
        type: existingExam.type,
        patient: existingExam.patient
      }
    });
  } catch (err) {
    // Delete uploaded file if database operation fails
    console.error('Error uploading file for exam:', err);
    res.status(500).json({ message: 'Failed to upload file', error: err.message });
    console.error(err);
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fileErr) {
        console.error('Error deleting uploaded file:', fileErr);
      }
    }
    console.error('Error uploading file:', err);
    res.status(500).json({ 
      message: 'Erreur lors de l\'upload du fichier', 
      error: err.message 
    });
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
      },
      include: {
        exam: {
          select: {
            id: true,
            type: true
          }
        }
      }
    });

    if (!existingFile) {
      return res.status(404).json({ 
        message: 'Fichier non trouvé ou n\'appartient pas à votre patient' 
      });
    }

    const deletedFromDrive = await deleteFromGoogleDrive(existingFile.fileUrl);

    if (!deletedFromDrive) {
      return res.status(500).json({ message: 'Failed to delete file from Google Drive' });
    }
    const fileName = existingFile.fileName;
    const examInfo = existingFile.exam;

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
      message: 'Fichier supprimé avec succès',
      fileId: parseInt(fileId),
      fileName: fileName,
      exam: examInfo
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du fichier', 
      error: err.message 
    });
  }
};
