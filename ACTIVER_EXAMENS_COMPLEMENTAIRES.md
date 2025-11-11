# 🔧 Activer les Examens Complémentaires avec Base de Données

## 🎯 Objectif

Activer la fonctionnalité d'Examens Complémentaires pour qu'elle sauvegarde dans la base de données PostgreSQL (pas seulement dans le navigateur).

---

## ⚠️ IMPORTANT: Migration de Base de Données Requise

Les examens complémentaires nécessitent deux nouvelles tables dans votre base de données:
- `ComplementaryExam` - Pour stocker les examens
- `ExamFile` - Pour stocker les fichiers associés

Ces tables n'existent pas encore dans votre base de données actuelle.

---

## 📋 Étapes d'Activation

### Étape 1: Configurer DATABASE_URL (5 minutes) ⚠️ CRITIQUE

**1.1 Créer le fichier .env**

```bash
cd /home/user/webapp
nano .env
```

**1.2 Ajouter votre configuration**

```env
# Database Configuration
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Server Configuration
PORT=4000

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
```

**1.3 Remplacer les valeurs**

Exemple réel:
```env
DATABASE_URL="postgresql://postgres:monMotDePasse@localhost:5432/cabinet_medical?schema=public"
PORT=4000
ACCESS_TOKEN_SECRET=mon_secret_jwt_2024_cabinet
REFRESH_TOKEN_SECRET=mon_refresh_secret_2024
```

**Où trouver ces informations:**
- `USERNAME`: Votre utilisateur PostgreSQL (souvent "postgres")
- `PASSWORD`: Le mot de passe de votre base de données
- `HOST`: localhost si PostgreSQL est sur la même machine
- `PORT`: 5432 (port par défaut de PostgreSQL)
- `DATABASE`: Le nom de votre base de données

**1.4 Vérifier que PostgreSQL est démarré**

```bash
# Sur Linux/Mac
sudo systemctl status postgresql

# Ou
pg_isready
```

---

### Étape 2: Exécuter la Migration Prisma (2 minutes) ⚠️ CRITIQUE

**2.1 Générer et appliquer la migration**

```bash
cd /home/user/webapp
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

**Ce que cette commande fait:**
1. Crée les tables `ComplementaryExam` et `ExamFile`
2. Ajoute les colonnes `email` et `address` à la table `Patient`
3. Configure les relations CASCADE pour la suppression
4. Crée un fichier de migration dans `prisma/migrations/`

**Résultat attendu:**
```
✔ Generated Prisma Client
✔ The migration has been created
✔ Applied migration: add_complementary_exams_and_patient_fields

Database schema is now in sync with your Prisma schema.
```

**2.2 En cas d'erreur "P1001: Can't reach database server"**

Vérifiez:
1. PostgreSQL est démarré
2. DATABASE_URL est correct dans .env
3. Le port 5432 n'est pas bloqué par un firewall

**2.3 En cas d'erreur de connexion**

```bash
# Tester la connexion manuellement
psql -U postgres -d cabinet_medical

# Si ça marche, votre DATABASE_URL doit être:
# postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/cabinet_medical?schema=public
```

---

### Étape 3: Vérifier que la Migration a Fonctionné (1 minute)

**3.1 Vérifier les tables créées**

```bash
npx prisma studio
```

Ou directement avec PostgreSQL:
```bash
psql -U postgres -d cabinet_medical -c "\dt"
```

**Vous devriez voir:**
- ✅ Table `ComplementaryExam`
- ✅ Table `ExamFile`
- ✅ Colonnes `email` et `address` dans `Patient`

**3.2 Vérifier avec SQL**

```sql
-- Connectez-vous à PostgreSQL
psql -U postgres -d cabinet_medical

-- Vérifier la table ComplementaryExam
\d "ComplementaryExam"

-- Vérifier la table ExamFile
\d "ExamFile"

-- Vérifier les nouveaux champs dans Patient
\d "Patient"
```

---

### Étape 4: Redémarrer le Serveur (30 secondes)

```bash
cd /home/user/webapp
npm run dev
```

**Vérifier qu'il n'y a pas d'erreurs:**
```
✔ Server running on port 4000
✔ WebSocket server running on ws://localhost:4000
```

---

### Étape 5: Intégrer le Frontend (15 minutes)

Maintenant que le backend est prêt, intégrez le code frontend dans votre `PatientProfile.jsx`.

**5.1 Ajouter le useEffect pour charger les examens**

Ajoutez ceci après votre useEffect actuel qui charge le patient:

```javascript
// Charger les examens complémentaires
useEffect(() => {
  const fetchComplementaryExams = async () => {
    if (!patientId) return;
    
    try {
      let response = await fetch(
        `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );

      // Gestion du token refresh
      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        response = await fetch(
          `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            credentials: 'include',
          }
        );
      }

      if (response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      } else if (response.status !== 404) {
        console.error('Erreur lors du chargement des examens');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  fetchComplementaryExams();
}, [patientId, refresh, logout]);
```

**5.2 Modifier handleSaveExam pour sauvegarder dans la BD**

Remplacez votre fonction `handleSaveExam` actuelle:

```javascript
const handleSaveExam = async () => {
  if (!examForm.type || !examForm.description || !examForm.date) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    let response;
    
    if (currentExam) {
      // UPDATE existing exam
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/${currentExam.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            type: examForm.type,
            description: examForm.description,
            date: examForm.date
          }),
        }
      );

      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        response = await fetch(
          `${baseURL}/medecin/complementary-exams/${currentExam.id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              type: examForm.type,
              description: examForm.description,
              date: examForm.date
            }),
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setExams(exams.map(exam => 
          exam.id === currentExam.id ? data.exam : exam
        ));
        alert('Examen mis à jour avec succès !');
      }
    } else {
      // CREATE new exam
      response = await fetch(`${baseURL}/medecin/complementary-exams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patientId: parseInt(patientId),
          type: examForm.type,
          description: examForm.description,
          date: examForm.date
        }),
      });

      if (response.status === 401) {
        const refreshResponse = await refresh();
        if (!refreshResponse) {
          logout();
          return;
        }
        response = await fetch(`${baseURL}/medecin/complementary-exams`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patientId: parseInt(patientId),
            type: examForm.type,
            description: examForm.description,
            date: examForm.date
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        setExams([...exams, data.exam]);
        alert('Examen créé avec succès !');
      }
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (!response.ok) {
      alert('Erreur lors de l\'enregistrement de l\'examen.');
      return;
    }

    setShowExamModal(false);
    setCurrentExam(null);
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  }
};
```

**5.3 Modifier handleDeleteExam**

```javascript
const handleDeleteExam = async (examId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
    return;
  }

  try {
    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/${examId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      }
    );

    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (!refreshResponse) {
        logout();
        return;
      }
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/${examId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (response.ok) {
      setExams(exams.filter(exam => exam.id !== examId));
      alert('Examen supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  }
};
```

**5.4 Modifier handleFileUploadForExam**

```javascript
const handleFileUploadForExam = async (examId, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  const ext = file.name.toLowerCase();
  if (!validTypes.includes(file.type) && !ext.endsWith('.dcm')) {
    alert('Type de fichier non supporté. PDF, images (JPG, PNG, GIF) ou DICOM uniquement.');
    return;
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    alert('Fichier trop volumineux. Maximum 50 MB.');
    return;
  }

  setUploadingFile(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/${examId}/files`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: formData,
      }
    );

    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (!refreshResponse) {
        logout();
        setUploadingFile(false);
        return;
      }
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/${examId}/files`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: formData,
        }
      );
    }

    if (response.status === 403) {
      logout();
      setUploadingFile(false);
      return;
    }

    if (response.ok) {
      const data = await response.json();
      
      // Mettre à jour l'examen avec le nouveau fichier
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: [...(exam.files || []), data.file] }
          : exam
      ));

      alert('Fichier uploadé avec succès !');
    } else {
      alert('Erreur lors de l\'upload.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  } finally {
    setUploadingFile(false);
  }
};
```

**5.5 Modifier handleDeleteFile**

```javascript
const handleDeleteFile = async (examId, fileId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
    return;
  }

  try {
    let response = await fetch(
      `${baseURL}/medecin/complementary-exams/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
      }
    );

    if (response.status === 401) {
      const refreshResponse = await refresh();
      if (!refreshResponse) {
        logout();
        return;
      }
      response = await fetch(
        `${baseURL}/medecin/complementary-exams/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
        }
      );
    }

    if (response.status === 403) {
      logout();
      return;
    }

    if (response.ok) {
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, files: exam.files.filter(f => f.id !== fileId) }
          : exam
      ));
      alert('Fichier supprimé avec succès !');
    } else {
      alert('Erreur lors de la suppression.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Une erreur est survenue.');
  }
};
```

**5.6 Modifier handlePreviewFile et handleDownloadFile**

```javascript
const handlePreviewFile = (file) => {
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const fileWithFullUrl = { ...file, url: fullUrl };
  setSelectedPreviewFile(fileWithFullUrl);
  setShowFilePreview(true);
};

const handleDownloadFile = (file) => {
  const fullUrl = `${baseURL}/${file.fileUrl}`;
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = file.fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

---

### Étape 6: Tester la Fonctionnalité (10 minutes)

**6.1 Test Création d'Examen**

1. Ouvrir la page d'un patient
2. Cliquer sur "Nouvel examen"
3. Remplir le formulaire:
   - Type: Échographie rénale
   - Description: Test de création
   - Date: Aujourd'hui
4. Cliquer sur "Créer"

**Résultat attendu:**
- ✅ Message "Examen créé avec succès !"
- ✅ L'examen apparaît dans la liste
- ✅ Rafraîchir la page: l'examen est toujours là (sauvegardé en BD)

**6.2 Test Upload de Fichier**

1. Cliquer sur l'examen créé pour l'ouvrir
2. Cliquer sur "Ajouter" dans la section fichiers
3. Sélectionner un fichier PDF ou image
4. Attendre l'upload

**Résultat attendu:**
- ✅ Message "Fichier uploadé avec succès !"
- ✅ Le fichier apparaît dans la liste
- ✅ Rafraîchir la page: le fichier est toujours là

**6.3 Test Preview/Download**

1. Cliquer sur l'icône "Voir" (œil)
   - ✅ Le fichier s'affiche dans un modal

2. Cliquer sur l'icône "Télécharger"
   - ✅ Le fichier se télécharge

**6.4 Test Delete**

1. Supprimer un fichier
   - ✅ Le fichier disparaît
   - ✅ Rafraîchir: toujours supprimé

2. Supprimer un examen
   - ✅ L'examen et tous ses fichiers sont supprimés
   - ✅ Rafraîchir: toujours supprimé

---

## 🎯 Checklist Complète

### Configuration
- [ ] Fichier .env créé avec DATABASE_URL
- [ ] PostgreSQL démarré et accessible
- [ ] Migration Prisma exécutée avec succès
- [ ] Tables ComplementaryExam et ExamFile créées
- [ ] Colonnes email et address ajoutées à Patient

### Backend
- [ ] Routes complementary-exams activées dans server.js
- [ ] Serveur redémarre sans erreur
- [ ] Test API avec cURL fonctionne

### Frontend
- [ ] useEffect pour charger les examens ajouté
- [ ] handleSaveExam modifié pour appeler l'API
- [ ] handleDeleteExam modifié pour appeler l'API
- [ ] handleFileUploadForExam modifié pour appeler l'API
- [ ] handleDeleteFile modifié pour appeler l'API
- [ ] handlePreviewFile modifié avec baseURL
- [ ] handleDownloadFile modifié avec baseURL

### Tests
- [ ] Création d'examen fonctionne
- [ ] Modification d'examen fonctionne
- [ ] Suppression d'examen fonctionne
- [ ] Upload de fichier fonctionne
- [ ] Preview de fichier fonctionne
- [ ] Download de fichier fonctionne
- [ ] Suppression de fichier fonctionne
- [ ] Données persistent après rafraîchissement

---

## 🐛 Dépannage

### Erreur: "P1001: Can't reach database server"

**Solution:**
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Si non démarré:
sudo systemctl start postgresql

# Tester la connexion
psql -U postgres -d cabinet_medical
```

### Erreur: "Unknown field 'email' in Patient"

**Cause:** La migration n'a pas été exécutée

**Solution:**
```bash
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

### Erreur: "Table 'ComplementaryExam' does not exist"

**Cause:** La migration n'a pas créé les tables

**Solution:**
```bash
# Vérifier les migrations
npx prisma migrate status

# Réappliquer si nécessaire
npx prisma migrate deploy
```

### Erreur 404 sur les endpoints complementary-exams

**Cause:** Routes non activées ou serveur pas redémarré

**Solution:**
```bash
# Vérifier que server.js a la ligne:
# app.use('/medecin/complementary-exams', complementaryExamsRoutes);

# Redémarrer le serveur
npm run dev
```

### Les fichiers ne s'uploadent pas

**Cause:** Dossier uploads/exams inexistant

**Solution:**
```bash
mkdir -p uploads/exams
chmod 755 uploads/exams
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (Navigateur) | Après (Base de Données) |
|--------|-------------------|------------------------|
| **Sauvegarde** | ❌ LocalStorage/State | ✅ PostgreSQL |
| **Persistance** | ❌ Perdu au refresh | ✅ Permanent |
| **Multi-dispositif** | ❌ Local uniquement | ✅ Accessible partout |
| **Fichiers** | ❌ Non supportés | ✅ Upload réel |
| **Backup** | ❌ Impossible | ✅ Avec la BD |
| **Partage** | ❌ Impossible | ✅ Entre médecins |

---

## ✅ Résumé

Après avoir suivi ce guide:

1. ✅ Les examens complémentaires sont sauvegardés dans PostgreSQL
2. ✅ Les fichiers sont uploadés sur le serveur (uploads/exams/)
3. ✅ Les données persistent après rafraîchissement
4. ✅ Tout fonctionne en production

---

**Date:** 10 Novembre 2024  
**Version:** 1.0.0  
**Status:** ✅ PRÊT POUR ACTIVATION
