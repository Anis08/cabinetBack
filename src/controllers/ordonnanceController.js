import prisma from '../prisma.js';

// ===========================
// GESTION DES ORDONNANCES
// ===========================

/**
 * Récupérer toutes les ordonnances d'un médecin
 * GET /medecin/ordonnances
 */
export const getAllOrdonnances = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { patientId, startDate, endDate, limit = 50 } = req.query;
    
    const where = { medecinId };
    
    // Filtrer par patient
    if (patientId) {
      where.patientId = parseInt(patientId);
    }
    
    // Filtrer par date
    if (startDate || endDate) {
      where.dateCreation = {};
      if (startDate) where.dateCreation.gte = new Date(startDate);
      if (endDate) where.dateCreation.lte = new Date(endDate);
    }
    
    const ordonnances = await prisma.ordonnance.findMany({
      where,
      take: parseInt(limit),
      orderBy: {
        dateCreation: 'desc'
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            dateOfBirth: true
          }
        },
        medicaments: {
          include: {
            medicament: {
              select: {
                id: true,
                nom: true,
                dosage: true,
                forme: true,
                moleculeMere: true,
                type: true
              }
            }
          }
        },
        rendezVous: {
          select: {
            id: true,
            date: true,
            state: true
          }
        }
      }
    });
    
    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const statsWhere = { medecinId };
    if (patientId) {
      statsWhere.patientId = parseInt(patientId);
    }
    
    const [total, thisMonth, todayCount] = await Promise.all([
      prisma.ordonnance.count({ where: statsWhere }),
      prisma.ordonnance.count({
        where: {
          ...statsWhere,
          dateCreation: { gte: startOfMonth }
        }
      }),
      prisma.ordonnance.count({
        where: {
          ...statsWhere,
          dateCreation: { gte: today }
        }
      })
    ]);
    
    res.status(200).json({
      ordonnances,
      count: ordonnances.length,
      stats: {
        total,
        thisMonth,
        today: todayCount
      },
      message: 'Ordonnances récupérées avec succès'
    });
  } catch (error) {
    console.error('Error fetching ordonnances:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des ordonnances',
      error: error.message
    });
  }
};

/**
 * Récupérer les ordonnances d'un patient spécifique
 * GET /medecin/ordonnances/patient/:patientId
 */
export const getOrdonnancesByPatient = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const patientId = parseInt(req.params.patientId);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'ID patient invalide' });
    }
    
    // Vérifier que le patient appartient au médecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        medecinId
      }
    });
    
    if (!patient) {
      return res.status(404).json({
        message: 'Patient non trouvé ou n\'appartient pas à ce médecin'
      });
    }
    
    const ordonnances = await prisma.ordonnance.findMany({
      where: {
        patientId,
        medecinId
      },
      orderBy: {
        dateCreation: 'desc'
      },
      include: {
        medicaments: {
          include: {
            medicament: {
              select: {
                id: true,
                nom: true,
                dosage: true,
                forme: true,
                moleculeMere: true,
                type: true
              }
            }
          }
        }
      }
    });
    
    res.status(200).json({
      ordonnances,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        phoneNumber: patient.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error fetching patient ordonnances:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des ordonnances du patient',
      error: error.message
    });
  }
};

/**
 * Récupérer une ordonnance par ID
 * GET /medecin/ordonnances/:id
 */
export const getOrdonnanceById = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const ordonnanceId = parseInt(req.params.id);
    
    if (isNaN(ordonnanceId)) {
      return res.status(400).json({ message: 'ID ordonnance invalide' });
    }
    
    const ordonnance = await prisma.ordonnance.findFirst({
      where: {
        id: ordonnanceId,
        medecinId
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            dateOfBirth: true,
            gender: true,
            maladieChronique: true
          }
        },
        medecin: {
          select: {
            id: true,
            fullName: true,
            speciality: true,
            phoneNumber: true
          }
        },
        medicaments: {
          include: {
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
        },
        rendezVous: {
          select: {
            id: true,
            date: true,
            state: true
          }
        }
      }
    });
    
    if (!ordonnance) {
      return res.status(404).json({
        message: 'Ordonnance non trouvée ou n\'appartient pas à ce médecin'
      });
    }
    
    res.status(200).json({ ordonnance });
  } catch (error) {
    console.error('Error fetching ordonnance:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'ordonnance',
      error: error.message
    });
  }
};

/**
 * Créer une nouvelle ordonnance
 * POST /medecin/ordonnances
 * Body: {
 *   patientId: number,
 *   rendezVousId?: number,
 *   dateValidite?: string,
 *   note?: string,
 *   medicaments: [
 *     {
 *       medicamentId?: number,
 *       medicamentData?: { nom, dosage, forme, fabricant, moleculeMere, type, frequence },
 *       posologie: string,
 *       duree?: string,
 *       instructions?: string
 *     }
 *   ]
 * }
 */
export const createOrdonnance = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const { patientId, rendezVousId, dateValidite, note, medicaments } = req.body;
    
    // Validation
    if (!patientId || !medicaments || !Array.isArray(medicaments) || medicaments.length === 0) {
      return res.status(400).json({
        message: 'Patient ID et au moins un médicament sont requis'
      });
    }
    
    // Vérifier que le patient appartient au médecin
    const patient = await prisma.patient.findFirst({
      where: {
        id: parseInt(patientId),
        medecinId
      }
    });
    
    if (!patient) {
      return res.status(404).json({
        message: 'Patient non trouvé ou n\'appartient pas à ce médecin'
      });
    }
    
    // Vérifier le rendez-vous si fourni
    if (rendezVousId) {
      const rdv = await prisma.rendezVous.findFirst({
        where: {
          id: parseInt(rendezVousId),
          patientId: parseInt(patientId),
          medecinId
        }
      });
      
      if (!rdv) {
        return res.status(404).json({
          message: 'Rendez-vous non trouvé'
        });
      }
    }
    
    // Traiter les médicaments et créer les demandes si nécessaire
    const medicamentsData = [];
    const demandesCreated = [];
    
    for (const med of medicaments) {
      // Support multiple field names for flexibility
      const posologie = med.posologie || med.frequence;
      const medicamentId = med.medicamentId || med.id;
      
      if (!posologie) {
        return res.status(400).json({
          message: 'La posologie/fréquence est requise pour chaque médicament'
        });
      }
      
      // Si le médicament a un ID, l'utiliser directement
      if (medicamentId) {
        medicamentsData.push({
          medicamentId: parseInt(medicamentId),
          posologie: posologie,
          duree: med.duree || null,
          instructions: med.instructions || med.momentPrise || null
        });
        continue;
      }
      
      // Si pas d'ID mais qu'on a les données du médicament, chercher ou créer
      if (med.nom && med.dosage && med.forme) {
        // Vérifier si le médicament existe déjà
        const existingMed = await prisma.medicament.findFirst({
          where: {
            nom: med.nom,
            dosage: med.dosage,
            forme: med.forme
          }
        });
        
        if (existingMed) {
          medicamentsData.push({
            medicamentId: existingMed.id,
            posologie: posologie,
            duree: med.duree || null,
            instructions: med.instructions || med.momentPrise || null
          });
        } else {
          // Créer une demande d'ajout si on a toutes les infos nécessaires
          if (med.fabricant && med.moleculeMere && med.type) {
            const demande = await prisma.demandeMedicament.create({
              data: {
                nom: med.nom,
                dosage: med.dosage,
                forme: med.forme,
                fabricant: med.fabricant,
                moleculeMere: med.moleculeMere,
                type: med.type,
                frequence: posologie,
                medecinId,
                status: 'EnAttente'
              }
            });
            
            demandesCreated.push(demande);
          } else {
            // Données incomplètes
            return res.status(400).json({
              message: `Données incomplètes pour le médicament: ${med.nom}. Fabricant, molécule mère et type sont requis.`
            });
          }
        }
      } else {
        return res.status(400).json({
          message: 'Chaque médicament doit avoir soit un ID, soit nom + dosage + forme'
        });
      }
    }
    
    // Créer l'ordonnance seulement si on a au moins un médicament validé
    if (medicamentsData.length === 0 && demandesCreated.length > 0) {
      return res.status(202).json({
        message: 'Demandes de médicaments créées. L\'ordonnance sera disponible après validation.',
        demandes: demandesCreated.map(d => ({
          id: d.id,
          nom: d.nom,
          dosage: d.dosage,
          forme: d.forme,
          status: d.status
        })),
        ordonnanceCreated: false
      });
    }
    
    if (medicamentsData.length === 0) {
      return res.status(400).json({
        message: 'Aucun médicament valide pour créer l\'ordonnance'
      });
    }
    
    // Créer l'ordonnance avec les médicaments
    const ordonnance = await prisma.ordonnance.create({
      data: {
        patientId: parseInt(patientId),
        medecinId,
        rendezVousId: rendezVousId ? parseInt(rendezVousId) : null,
        dateValidite: dateValidite ? new Date(dateValidite) : null,
        note,
        medicaments: {
          create: medicamentsData
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true
          }
        },
        medicaments: {
          include: {
            medicament: {
              select: {
                id: true,
                nom: true,
                dosage: true,
                forme: true,
                moleculeMere: true,
                type: true
              }
            }
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Ordonnance créée avec succès',
      ordonnance,
      demandesCreated: demandesCreated.length > 0 ? demandesCreated.map(d => ({
        id: d.id,
        nom: d.nom,
        dosage: d.dosage,
        status: d.status
      })) : null
    });
  } catch (error) {
    console.error('Error creating ordonnance:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de l\'ordonnance',
      error: error.message
    });
  }
};

/**
 * Modifier une ordonnance (ajouter/supprimer des médicaments, modifier la note)
 * PUT /medecin/ordonnances/:id
 */
export const updateOrdonnance = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const ordonnanceId = parseInt(req.params.id);
    const { dateValidite, note, medicaments } = req.body;
    
    if (isNaN(ordonnanceId)) {
      return res.status(400).json({ message: 'ID ordonnance invalide' });
    }
    
    // Vérifier que l'ordonnance appartient au médecin
    const existingOrdonnance = await prisma.ordonnance.findFirst({
      where: {
        id: ordonnanceId,
        medecinId
      }
    });
    
    if (!existingOrdonnance) {
      return res.status(404).json({
        message: 'Ordonnance non trouvée ou n\'appartient pas à ce médecin'
      });
    }
    
    // Préparer les données de mise à jour
    const updateData = {};
    if (dateValidite !== undefined) updateData.dateValidite = dateValidite ? new Date(dateValidite) : null;
    if (note !== undefined) updateData.note = note;
    
    // Si des médicaments sont fournis, remplacer tous les médicaments
    if (medicaments && Array.isArray(medicaments)) {
      // Supprimer les anciens liens
      await prisma.ordonnanceMedicament.deleteMany({
        where: {
          ordonnanceId
        }
      });
      
      // Créer les nouveaux liens
      const medicamentsData = medicaments.map(med => ({
        medicamentId: parseInt(med.medicamentId),
        posologie: med.posologie,
        duree: med.duree,
        instructions: med.instructions
      }));
      
      updateData.medicaments = {
        create: medicamentsData
      };
    }
    
    // Mettre à jour l'ordonnance
    const updatedOrdonnance = await prisma.ordonnance.update({
      where: { id: ordonnanceId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true
          }
        },
        medicaments: {
          include: {
            medicament: {
              select: {
                id: true,
                nom: true,
                dosage: true,
                forme: true,
                moleculeMere: true,
                type: true
              }
            }
          }
        }
      }
    });
    
    res.status(200).json({
      message: 'Ordonnance modifiée avec succès',
      ordonnance: updatedOrdonnance
    });
  } catch (error) {
    console.error('Error updating ordonnance:', error);
    res.status(500).json({
      message: 'Erreur lors de la modification de l\'ordonnance',
      error: error.message
    });
  }
};

/**
 * Supprimer une ordonnance
 * DELETE /medecin/ordonnances/:id
 */
export const deleteOrdonnance = async (req, res) => {
  const medecinId = req.medecinId;
  
  try {
    const ordonnanceId = parseInt(req.params.id);
    
    if (isNaN(ordonnanceId)) {
      return res.status(400).json({ message: 'ID ordonnance invalide' });
    }
    
    // Vérifier que l'ordonnance appartient au médecin
    const ordonnance = await prisma.ordonnance.findFirst({
      where: {
        id: ordonnanceId,
        medecinId
      }
    });
    
    if (!ordonnance) {
      return res.status(404).json({
        message: 'Ordonnance non trouvée ou n\'appartient pas à ce médecin'
      });
    }
    
    // Supprimer (CASCADE supprimera les OrdonnanceMedicament)
    await prisma.ordonnance.delete({
      where: { id: ordonnanceId }
    });
    
    res.status(200).json({
      message: 'Ordonnance supprimée avec succès',
      ordonnanceId
    });
  } catch (error) {
    console.error('Error deleting ordonnance:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'ordonnance',
      error: error.message
    });
  }
};

export default {
  getAllOrdonnances,
  getOrdonnancesByPatient,
  getOrdonnanceById,
  createOrdonnance,
  updateOrdonnance,
  deleteOrdonnance
};
