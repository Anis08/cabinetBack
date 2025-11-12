# 🧪 Test de l'Endpoint `/medecin/profile-patient/:id`

## Problème

L'endpoint retourne une erreur 500. Cela peut être dû à plusieurs causes:

## Causes Possibles

### 1. ✅ Champ `status` inexistant - **CORRIGÉ**
Le champ a été supprimé du code.

### 2. 🔍 Base de données non synchronisée
Si les tables `Ordonnance` et `OrdonnanceMedicament` n'existent pas dans la BDD.

### 3. 🔍 Patient inexistant
Le patient avec `id=1` n'existe peut-être pas.

### 4. 🔍 Problème de relation Prisma
Les relations entre Patient → Ordonnance → OrdonnanceMedicament → Medicament peuvent être mal configurées.

---

## Solution Temporaire: Désactiver les Ordonnances

Si vous voulez que l'endpoint fonctionne immédiatement sans ordonnances, modifiez le code:

### Fichier: `src/controllers/medecinController.js`

**Ligne ~974, remplacez:**

```javascript
const [patient, nextAppointment, ordonnances] = await prisma.$transaction([
  prisma.patient.findUnique({...}),
  prisma.rendezVous.findFirst({...}),
  prisma.ordonnance.findMany({...})  // ← Cette partie cause l'erreur
])
```

**Par:**

```javascript
const [patient, nextAppointment] = await prisma.$transaction([
  prisma.patient.findUnique({...}),
  prisma.rendezVous.findFirst({...})
  // ordonnances temporairement désactivées
])

// Ajouter un tableau vide pour ordonnances
const ordonnances = [];
```

**Et à la ligne ~1067:**

```javascript
res.status(200).json({
  patient, 
  nextAppointment,
  ordonnances: []  // Retourner tableau vide
});
```

---

## Solution Permanente: Vérifier la Base de Données

### Étape 1: Vérifier que les tables existent

```sql
-- Connectez-vous à votre base de données PostgreSQL
-- et exécutez:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Ordonnance', 'OrdonnanceMedicament', 'Medicament');
```

Si ces tables n'existent pas, vous devez appliquer les migrations:

```bash
cd /home/user/webapp
npx prisma migrate deploy
```

### Étape 2: Vérifier qu'un patient existe

```sql
SELECT id, "fullName" FROM "Patient" LIMIT 5;
```

### Étape 3: Tester la requête manuellement

```sql
-- Test de la requête ordonnances
SELECT 
  o.id,
  o."dateCreation",
  o."dateValidite",
  o.note,
  o."rendezVousId"
FROM "Ordonnance" o
WHERE o."patientId" = 1
  AND o."medecinId" = (SELECT "medecinId" FROM "Patient" WHERE id = 1)
ORDER BY o."dateCreation" DESC;
```

---

## Quick Fix Immédiat

Pour faire fonctionner l'endpoint **MAINTENANT**, voici un patch rapide:

```javascript
// src/controllers/medecinController.js - ligne ~974

export const getPatientProfile = async (req, res) => {
  const medecinId = req.medecinId;
  const patientId = req.params.id;
  try {
    // Requête patient et nextAppointment uniquement
    const [patient, nextAppointment] = await prisma.$transaction([
      prisma.patient.findUnique({
        where: { id: parseInt(patientId) },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
          address: true,
          gender: true,
          poids: true,
          taille: true,
          dateOfBirth: true,
          bio: true,
          maladieChronique: true,
          createdAt: true,
          rendezVous: {
            where: { state: 'Completed' },
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              state: true,
              arrivalTime: true,
              paid: true,
              note: true,
              poids: true,
              pcm: true,
              imc: true,
              pulse: true,
              paSystolique: true,
              paDiastolique: true
            },
            orderBy: { date: 'desc' }
          }
        }
      }),
      prisma.rendezVous.findFirst({
        where: {
          patientId: parseInt(patientId),
          medecinId,
          state: { in: ['Scheduled', 'Waiting', 'InProgress'] }
        },
        orderBy: { date: 'asc' }
      })
    ]);

    if (!patient) {
      return res.status(404).json({ message: 'No patients found' });
    }

    // Essayer de récupérer les ordonnances (peut échouer si tables n'existent pas)
    let ordonnances = [];
    try {
      ordonnances = await prisma.ordonnance.findMany({
        where: {
          patientId: parseInt(patientId),
          medecinId
        },
        orderBy: { dateCreation: 'desc' },
        select: {
          id: true,
          dateCreation: true,
          dateValidite: true,
          note: true,
          rendezVousId: true,
          medicaments: {
            select: {
              medicament: {
                select: {
                  id: true,
                  nom: true,
                  dosage: true,
                  forme: true,
                  type: true
                }
              },
              posologie: true,
              duree: true,
              instructions: true
            }
          }
        }
      });
    } catch (ordError) {
      console.warn('Could not fetch ordonnances:', ordError.message);
      // Continue sans ordonnances
    }

    res.status(200).json({
      patient, 
      nextAppointment,
      ordonnances
    });
  } catch (err) {
    console.error('Error in getPatientProfile:', err);
    res.status(500).json({ 
      message: 'Failed to get patient profile', 
      error: err.message 
    });
  }
}
```

Ce code:
1. ✅ Récupère le patient et le prochain RDV (essentiel)
2. ✅ Essaie de récupérer les ordonnances (optionnel)
3. ✅ Continue même si les ordonnances échouent
4. ✅ Retourne au moins les données du patient

---

## Debugging en Production

Pour voir l'erreur exacte côté serveur:

```bash
# Surveillez les logs en temps réel
cd /home/user/webapp
tail -f server.log

# Dans un autre terminal, testez l'endpoint
curl -X GET "http://localhost:4000/medecin/profile-patient/1" \
  -H "Authorization: Bearer YOUR_REAL_TOKEN"
```

L'erreur complète apparaîtra dans `server.log`.

---

## Checklist de Dépannage

- [ ] Vérifier que le serveur tourne: `ps aux | grep node`
- [ ] Vérifier les logs: `tail -f server.log`
- [ ] Vérifier que la BDD est connectée
- [ ] Vérifier que les tables existent
- [ ] Vérifier qu'un patient avec id=1 existe
- [ ] Vérifier que le token JWT est valide
- [ ] Essayer avec un autre patientId
- [ ] Appliquer le Quick Fix ci-dessus

---

## Contact

Si le problème persiste après avoir appliqué le Quick Fix, vérifiez:

1. Les logs serveur pour l'erreur exacte
2. Que la base de données est accessible
3. Que les migrations Prisma ont été appliquées
4. Que le patient demandé existe vraiment

**Status Actuel:** Serveur ✅ Running | Endpoint ❌ Error 500  
**Quick Fix:** Disponible ci-dessus ⬆️
