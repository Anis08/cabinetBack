import prisma from '../prisma.js';

// ===========================
// GESTION DES DEMANDES DE MÉDICAMENTS
// ===========================

/**
 * Récupérer toutes les demandes (pour l'admin/médecin principal)
 * GET /medecin/demandes-medicaments
 */
export const getAllDemandes = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { status, startDate, endDate } = req.query;
    
    const where = {};
    
    // Filtrer par status
    if (status) {
      where.status = status;
    }
    
    // Filtrer par date
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    const demandes = await prisma.demandeMedicament.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true
          }
        },
        medicament: {
          select: {
            id: true,
            nom: true,
            dosage: true,
            forme: true
          }
        }
      }
    });
    
    // Statistiques
    const stats = {
      total: demandes.length,
      enAttente: demandes.filter(d => d.status === 'EnAttente').length,
      acceptees: demandes.filter(d => d.status === 'Acceptee').length,
      rejetees: demandes.filter(d => d.status === 'Rejetee').length
    };
    
    res.status(200).json({
      demandes,
      stats,
      message: 'Demandes récupérées avec succès'
    });
  } catch (error) {
    console.error('Error fetching demandes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes',
      error: error.message
    });
  }
};

/**
 * Récupérer les demandes d'un médecin spécifique
 * GET /medecin/demandes-medicaments/mes-demandes
 */
export const getMesDemandes = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { status } = req.query;
    
    const where = { medecinId };
    
    if (status) {
      where.status = status;
    }
    
    const demandes = await prisma.demandeMedicament.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        medicament: {
          select: {
            id: true,
            nom: true,
            dosage: true,
            forme: true
          }
        }
      }
    });
    
    res.status(200).json({
      demandes,
      count: demandes.length
    });
  } catch (error) {
    console.error('Error fetching mes demandes:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de vos demandes',
      error: error.message
    });
  }
};

/**
 * Récupérer une demande par ID
 * GET /medecin/demandes-medicaments/:id
 */
export const getDemandeById = async (req, res) => {
  try {
    const demandeId = parseInt(req.params.id);
    
    if (isNaN(demandeId)) {
      return res.status(400).json({ message: 'ID de demande invalide' });
    }
    
    const demande = await prisma.demandeMedicament.findUnique({
      where: { id: demandeId },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true,
            phoneNumber: true
          }
        },
        medicament: {
          select: {
            id: true,
            nom: true,
            dosage: true,
            forme: true,
            fabricant: true,
            moleculeMere: true,
            type: true
          }
        }
      }
    });
    
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    
    res.status(200).json({ demande });
  } catch (error) {
    console.error('Error fetching demande:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la demande',
      error: error.message
    });
  }
};

/**
 * Créer une demande de médicament
 * POST /medecin/demandes-medicaments
 * Body: { nom, dosage, forme, fabricant, moleculeMere, type, frequence }
 */
export const createDemande = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { nom, dosage, forme, fabricant, moleculeMere, type, frequence } = req.body;
    
    // Validation
    if (!nom || !dosage || !forme || !fabricant || !moleculeMere || !type) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis (nom, dosage, forme, fabricant, moleculeMere, type)'
      });
    }
    
    // Vérifier si le médicament existe déjà
    const existingMedicament = await prisma.medicament.findFirst({
      where: {
        nom,
        dosage,
        forme
      }
    });
    
    if (existingMedicament) {
      return res.status(409).json({
        message: 'Ce médicament existe déjà dans la base de données',
        medicament: existingMedicament
      });
    }
    
    // Vérifier s'il existe déjà une demande en attente pour ce médicament
    const existingDemande = await prisma.demandeMedicament.findFirst({
      where: {
        nom,
        dosage,
        forme,
        status: 'EnAttente'
      }
    });
    
    if (existingDemande) {
      return res.status(409).json({
        message: 'Une demande pour ce médicament est déjà en attente de validation',
        demande: existingDemande
      });
    }
    
    // Créer la demande
    const demande = await prisma.demandeMedicament.create({
      data: {
        nom,
        dosage,
        forme,
        fabricant,
        moleculeMere,
        type,
        frequence: frequence || '3 fois par jour',
        medecinId,
        status: 'EnAttente'
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Demande créée avec succès. En attente de validation.',
      demande
    });
  } catch (error) {
    console.error('Error creating demande:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la demande',
      error: error.message
    });
  }
};

/**
 * Accepter une demande de médicament (Admin/Médecin principal)
 * POST /medecin/demandes-medicaments/:id/accepter
 */
export const accepterDemande = async (req, res) => {
  const medecinId = req.medecinId; // Admin qui traite la demande
  
  try {
    const demandeId = parseInt(req.params.id);
    
    if (isNaN(demandeId)) {
      return res.status(400).json({ message: 'ID de demande invalide' });
    }
    
    // Récupérer la demande
    const demande = await prisma.demandeMedicament.findUnique({
      where: { id: demandeId }
    });
    
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    
    if (demande.status !== 'EnAttente') {
      return res.status(400).json({
        message: `Cette demande a déjà été ${demande.status === 'Acceptee' ? 'acceptée' : 'rejetée'}`
      });
    }
    
    // Vérifier une dernière fois que le médicament n'existe pas
    const existingMedicament = await prisma.medicament.findFirst({
      where: {
        nom: demande.nom,
        dosage: demande.dosage,
        forme: demande.forme
      }
    });
    
    if (existingMedicament) {
      // Mettre à jour la demande pour pointer vers le médicament existant
      await prisma.demandeMedicament.update({
        where: { id: demandeId },
        data: {
          status: 'Acceptee',
          medicamentId: existingMedicament.id,
          traitePar: medecinId,
          dateTraitement: new Date()
        }
      });
      
      return res.status(200).json({
        message: 'Le médicament existe déjà. Demande marquée comme acceptée.',
        medicament: existingMedicament
      });
    }
    
    // Créer le médicament
    const medicament = await prisma.medicament.create({
      data: {
        nom: demande.nom,
        dosage: demande.dosage,
        forme: demande.forme,
        fabricant: demande.fabricant,
        moleculeMere: demande.moleculeMere,
        type: demande.type,
        frequence: demande.frequence,
        medecinId: null // Médicament global
      }
    });
    
    // Mettre à jour la demande
    const updatedDemande = await prisma.demandeMedicament.update({
      where: { id: demandeId },
      data: {
        status: 'Acceptee',
        medicamentId: medicament.id,
        traitePar: medecinId,
        dateTraitement: new Date()
      },
      include: {
        medicament: true,
        medecin: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    res.status(200).json({
      message: 'Demande acceptée et médicament ajouté à la base de données',
      demande: updatedDemande,
      medicament
    });
  } catch (error) {
    console.error('Error accepting demande:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'acceptation de la demande',
      error: error.message
    });
  }
};

/**
 * Rejeter une demande de médicament
 * POST /medecin/demandes-medicaments/:id/rejeter
 * Body: { motifRejet: string }
 */
export const rejeterDemande = async (req, res) => {
  const medecinId = req.medecinId; // Admin qui traite la demande
  
  try {
    const demandeId = parseInt(req.params.id);
    const { motifRejet } = req.body;
    
    if (isNaN(demandeId)) {
      return res.status(400).json({ message: 'ID de demande invalide' });
    }
    
    if (!motifRejet || motifRejet.trim() === '') {
      return res.status(400).json({
        message: 'Le motif de rejet est requis'
      });
    }
    
    // Récupérer la demande
    const demande = await prisma.demandeMedicament.findUnique({
      where: { id: demandeId }
    });
    
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    
    if (demande.status !== 'EnAttente') {
      return res.status(400).json({
        message: `Cette demande a déjà été ${demande.status === 'Acceptee' ? 'acceptée' : 'rejetée'}`
      });
    }
    
    // Rejeter la demande
    const updatedDemande = await prisma.demandeMedicament.update({
      where: { id: demandeId },
      data: {
        status: 'Rejetee',
        motifRejet,
        traitePar: medecinId,
        dateTraitement: new Date()
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    res.status(200).json({
      message: 'Demande rejetée',
      demande: updatedDemande
    });
  } catch (error) {
    console.error('Error rejecting demande:', error);
    res.status(500).json({
      message: 'Erreur lors du rejet de la demande',
      error: error.message
    });
  }
};

/**
 * Supprimer une demande (seulement si créée par le médecin connecté et en attente)
 * DELETE /medecin/demandes-medicaments/:id
 */
export const deleteDemande = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const demandeId = parseInt(req.params.id);
    
    if (isNaN(demandeId)) {
      return res.status(400).json({ message: 'ID de demande invalide' });
    }
    
    // Récupérer la demande
    const demande = await prisma.demandeMedicament.findFirst({
      where: {
        id: demandeId,
        medecinId
      }
    });
    
    if (!demande) {
      return res.status(404).json({
        message: 'Demande non trouvée ou n\'appartient pas à ce médecin'
      });
    }
    
    if (demande.status !== 'EnAttente') {
      return res.status(400).json({
        message: 'Seules les demandes en attente peuvent être supprimées'
      });
    }
    
    // Supprimer
    await prisma.demandeMedicament.delete({
      where: { id: demandeId }
    });
    
    res.status(200).json({
      message: 'Demande supprimée avec succès',
      demandeId
    });
  } catch (error) {
    console.error('Error deleting demande:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la demande',
      error: error.message
    });
  }
};

export default {
  getAllDemandes,
  getMesDemandes,
  getDemandeById,
  createDemande,
  accepterDemande,
  rejeterDemande,
  deleteDemande
};
