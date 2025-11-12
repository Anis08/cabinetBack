import prisma from '../prisma.js';

// ===========================
// GESTION DES MÉDICAMENTS
// ===========================

/**
 * Récupérer tous les médicaments
 * GET /medecin/medicaments
 */
export const getAllMedicaments = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { search, type, moleculeMere, dosage, dateDebut, dateFin } = req.query;
    
    // Construction dynamique des filtres
    const where = {};
    
    // Recherche textuelle
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { moleculeMere: { contains: search, mode: 'insensitive' } },
        { fabricant: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Filtres spécifiques
    if (type) where.type = type;
    if (moleculeMere) where.moleculeMere = { contains: moleculeMere, mode: 'insensitive' };
    if (dosage) where.dosage = { contains: dosage, mode: 'insensitive' };
    
    // Filtres par date
    if (dateDebut || dateFin) {
      where.createdAt = {};
      if (dateDebut) where.createdAt.gte = new Date(dateDebut);
      if (dateFin) where.createdAt.lte = new Date(dateFin);
    }
    
    const medicaments = await prisma.medicament.findMany({
      where,
      orderBy: {
        nom: 'asc'
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true
          }
        },
        ordonnanceMedicaments: {
          select: {
            id: true,
            ordonnanceId: true,
            posologie: true,
            duree: true
          },
          take: 5 // Limit to last 5 usages
        },
        demandeMedicaments: {
          select: {
            id: true,
            status: true,
            createdAt: true
          },
          where: {
            status: 'EnAttente'
          }
        }
      }
    });
    
    // Statistiques
    const stats = {
      total: medicaments.length,
      types: [...new Set(medicaments.map(m => m.type))].length,
      fabricants: [...new Set(medicaments.map(m => m.fabricant))].length
    };
    
    res.status(200).json({
      medicaments,
      stats,
      message: 'Médicaments récupérés avec succès'
    });
  } catch (error) {
    console.error('Error fetching medicaments:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des médicaments',
      error: error.message
    });
  }
};

/**
 * Rechercher des médicaments (pour autocomplete dans ordonnance)
 * GET /medecin/medicaments/search?q=doliprane
 */
export const searchMedicaments = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        message: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }
    
    const medicaments = await prisma.medicament.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { moleculeMere: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20, // Limiter à 20 résultats
      orderBy: {
        nom: 'asc'
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true
          }
        },
        _count: {
          select: {
            ordonnanceMedicaments: true
          }
        }
      }
    });
    
    res.status(200).json({
      medicaments,
      count: medicaments.length
    });
  } catch (error) {
    console.error('Error searching medicaments:', error);
    res.status(500).json({
      message: 'Erreur lors de la recherche de médicaments',
      error: error.message
    });
  }
};

/**
 * Récupérer un médicament par ID
 * GET /medecin/medicaments/:id
 */
export const getMedicamentById = async (req, res) => {
  try {
    const medicamentId = parseInt(req.params.id);
    
    if (isNaN(medicamentId)) {
      return res.status(400).json({ message: 'ID de médicament invalide' });
    }
    
    const medicament = await prisma.medicament.findUnique({
      where: { id: medicamentId },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true,
            phoneNumber: true,
            email: true
          }
        },
        ordonnanceMedicaments: {
          select: {
            id: true,
            ordonnanceId: true,
            posologie: true,
            duree: true,
            instructions: true,
            ordonnance: {
              select: {
                id: true,
                dateCreation: true,
                patient: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          },
          orderBy: {
            ordonnance: {
              dateCreation: 'desc'
            }
          },
          take: 10 // Last 10 usages
        },
        demandeMedicaments: {
          select: {
            id: true,
            status: true,
            motifRejet: true,
            createdAt: true,
            dateTraitement: true,
            medecin: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            ordonnanceMedicaments: true,
            demandeMedicaments: true
          }
        }
      }
    });
    
    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }
    
    res.status(200).json({ medicament });
  } catch (error) {
    console.error('Error fetching medicament:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du médicament',
      error: error.message
    });
  }
};

/**
 * Créer un nouveau médicament
 * POST /medecin/medicaments
 */
export const createMedicament = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { nom, dosage, forme, fabricant, moleculeMere, type, frequence } = req.body;
    
    // Validation
    if (!nom || !dosage || !forme || !fabricant || !moleculeMere || !type) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis (nom, dosage, forme, fabricant, moleculeMere, type)'
      });
    }
    
    // Vérifier si le médicament existe déjà (même nom, dosage, forme)
    const existingMedicament = await prisma.medicament.findUnique({
      where: {
        nom_dosage_forme: {
          nom,
          dosage,
          forme
        }
      }
    });
    
    if (existingMedicament) {
      return res.status(409).json({
        message: 'Ce médicament existe déjà dans la base de données',
        medicament: existingMedicament
      });
    }
    
    // Créer le médicament
    const medicament = await prisma.medicament.create({
      data: {
        nom,
        dosage,
        forme,
        fabricant,
        moleculeMere,
        type,
        frequence: frequence || '3 fois par jour',
        medecinId // Peut être null pour les médicaments globaux
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true
          }
        },
        _count: {
          select: {
            ordonnanceMedicaments: true,
            demandeMedicaments: true
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Médicament créé avec succès',
      medicament
    });
  } catch (error) {
    console.error('Error creating medicament:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du médicament',
      error: error.message
    });
  }
};

/**
 * Modifier un médicament
 * PUT /medecin/medicaments/:id
 */
export const updateMedicament = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const medicamentId = parseInt(req.params.id);
    const { nom, dosage, forme, fabricant, moleculeMere, type, frequence } = req.body;
    
    if (isNaN(medicamentId)) {
      return res.status(400).json({ message: 'ID de médicament invalide' });
    }
    
    // Vérifier que le médicament existe
    const existingMedicament = await prisma.medicament.findUnique({
      where: { id: medicamentId }
    });
    
    if (!existingMedicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }
    
    // Validation
    if (!nom || !dosage || !forme || !fabricant || !moleculeMere || !type) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }
    
    // Vérifier l'unicité si on change nom/dosage/forme
    if (nom !== existingMedicament.nom || dosage !== existingMedicament.dosage || forme !== existingMedicament.forme) {
      const duplicate = await prisma.medicament.findFirst({
        where: {
          nom,
          dosage,
          forme,
          id: { not: medicamentId }
        }
      });
      
      if (duplicate) {
        return res.status(409).json({
          message: 'Un médicament avec ce nom, dosage et forme existe déjà'
        });
      }
    }
    
    // Mettre à jour
    const updatedMedicament = await prisma.medicament.update({
      where: { id: medicamentId },
      data: {
        nom,
        dosage,
        forme,
        fabricant,
        moleculeMere,
        type,
        frequence: frequence || existingMedicament.frequence
      },
      include: {
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true
          }
        },
        _count: {
          select: {
            ordonnanceMedicaments: true,
            demandeMedicaments: true
          }
        }
      }
    });
    
    res.status(200).json({
      message: 'Médicament modifié avec succès',
      medicament: updatedMedicament
    });
  } catch (error) {
    console.error('Error updating medicament:', error);
    res.status(500).json({
      message: 'Erreur lors de la modification du médicament',
      error: error.message
    });
  }
};

/**
 * Supprimer un médicament
 * DELETE /medecin/medicaments/:id
 */
export const deleteMedicament = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const medicamentId = parseInt(req.params.id);
    
    if (isNaN(medicamentId)) {
      return res.status(400).json({ message: 'ID de médicament invalide' });
    }
    
    // Vérifier que le médicament existe
    const medicament = await prisma.medicament.findUnique({
      where: { id: medicamentId },
      include: {
        ordonnanceMedicaments: true
      }
    });
    
    if (!medicament) {
      return res.status(404).json({ message: 'Médicament non trouvé' });
    }
    
    // Vérifier si le médicament est utilisé dans des ordonnances
    if (medicament.ordonnanceMedicaments.length > 0) {
      return res.status(400).json({
        message: 'Ce médicament ne peut pas être supprimé car il est utilisé dans des ordonnances',
        ordonnancesCount: medicament.ordonnanceMedicaments.length
      });
    }
    
    // Supprimer
    await prisma.medicament.delete({
      where: { id: medicamentId }
    });
    
    res.status(200).json({
      message: 'Médicament supprimé avec succès',
      medicamentId
    });
  } catch (error) {
    console.error('Error deleting medicament:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du médicament',
      error: error.message
    });
  }
};

export default {
  getAllMedicaments,
  searchMedicaments,
  getMedicamentById,
  createMedicament,
  updateMedicament,
  deleteMedicament
};
