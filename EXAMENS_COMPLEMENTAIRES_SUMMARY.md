# Examens Complémentaires - Configuration Backend Complète

## 📋 Vue d'ensemble

Le système d'examens complémentaires est **déjà entièrement implémenté et fonctionnel** dans le backend. Cette documentation fournit toutes les informations nécessaires pour configurer et utiliser les endpoints.

## 🚀 Changements Récents (Commit: a9669e7)

### Nouvelles Fonctionnalités
- ✅ **Endpoint getById** : Récupération d'un examen spécifique
- ✅ **Statistiques** : Calcul automatique des stats (total, fichiers, types, récents)
- ✅ **Localisation française** : Tous les messages d'erreur en français
- ✅ **Réponses enrichies** : Info patient et contexte dans toutes les réponses
- ✅ **Documentation complète** : Guide API de 16KB en français

### Améliorations
- Meilleure gestion des erreurs avec contexte
- Comptage des fichiers supprimés lors de la suppression
- Nettoyage automatique des fichiers lors de l'échec d'upload
- Validation stricte des permissions médecin

---

## 📌 Endpoints Disponibles

### Base URL
```
/medecin/complementary-exams
```

### 1. **GET** `/patient/:patientId` - Tous les examens d'un patient

**Description** : Récupère tous les examens complémentaires d'un patient avec statistiques

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Réponse (200 OK)** :
```json
{
  "patient": {
    "id": 1,
    "fullName": "Jean Dupont",
    "dateOfBirth": "1985-05-15T00:00:00.000Z",
    "gender": "M"
  },
  "exams": [
    {
      "id": 1,
      "patientId": 1,
      "type": "Échographie rénale",
      "description": "Échographie des reins pour dépistage",
      "date": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-14T14:30:00.000Z",
      "updatedAt": "2024-01-14T14:30:00.000Z",
      "files": [
        {
          "id": 1,
          "examId": 1,
          "fileName": "echo_reins.pdf",
          "fileUrl": "uploads/exams/exam-1234567890-123456789.pdf",
          "fileType": "application/pdf",
          "fileSize": 2048576,
          "uploadDate": "2024-01-14T14:35:00.000Z"
        }
      ]
    }
  ],
  "stats": {
    "total": 5,
    "totalFiles": 8,
    "types": ["Échographie rénale", "Scanner thoracique", "IRM cérébrale"],
    "recentExams": 2
  },
  "message": "Examens récupérés avec succès"
}
```

**Erreurs possibles** :
- `404` : Patient non trouvé ou n'appartient pas à ce médecin
- `500` : Erreur serveur

---

### 2. **GET** `/:examId` - Un examen spécifique

**Description** : Récupère un examen complémentaire par son ID

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Réponse (200 OK)** :
```json
{
  "exam": {
    "id": 1,
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Échographie des reins pour dépistage",
    "date": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-14T14:30:00.000Z",
    "updatedAt": "2024-01-14T14:30:00.000Z",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont",
      "dateOfBirth": "1985-05-15T00:00:00.000Z",
      "gender": "M"
    },
    "files": [
      {
        "id": 1,
        "examId": 1,
        "fileName": "echo_reins.pdf",
        "fileUrl": "uploads/exams/exam-1234567890-123456789.pdf",
        "fileType": "application/pdf",
        "fileSize": 2048576,
        "uploadDate": "2024-01-14T14:35:00.000Z"
      }
    ]
  }
}
```

**Erreurs possibles** :
- `404` : Examen non trouvé ou n'appartient pas à votre patient
- `500` : Erreur serveur

---

### 3. **POST** `/` - Créer un nouvel examen

**Description** : Crée un nouvel examen complémentaire pour un patient

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Body (JSON)** :
```json
{
  "patientId": 1,
  "type": "Scanner thoracique",
  "description": "Scanner thoracique avec injection pour suspicion de nodule",
  "date": "2024-02-20T09:30:00.000Z"
}
```

**Réponse (201 Created)** :
```json
{
  "message": "Examen complémentaire créé avec succès",
  "exam": {
    "id": 6,
    "patientId": 1,
    "type": "Scanner thoracique",
    "description": "Scanner thoracique avec injection pour suspicion de nodule",
    "date": "2024-02-20T09:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont"
    },
    "files": []
  }
}
```

**Erreurs possibles** :
- `400` : Patient ID, type, description et date sont requis
- `404` : Patient non trouvé ou n'appartient pas à ce médecin
- `500` : Erreur serveur

---

### 4. **PUT** `/:examId` - Modifier un examen

**Description** : Modifie un examen existant

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Body (JSON - tous les champs optionnels)** :
```json
{
  "type": "Scanner thoracique haute résolution",
  "description": "Scanner thoracique HRCT pour fibrose pulmonaire",
  "date": "2024-02-21T10:00:00.000Z"
}
```

**Réponse (200 OK)** :
```json
{
  "message": "Examen complémentaire modifié avec succès",
  "exam": {
    "id": 6,
    "patientId": 1,
    "type": "Scanner thoracique haute résolution",
    "description": "Scanner thoracique HRCT pour fibrose pulmonaire",
    "date": "2024-02-21T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:05:00.000Z",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont"
    },
    "files": []
  }
}
```

**Erreurs possibles** :
- `404` : Examen non trouvé ou n'appartient pas à votre patient
- `500` : Erreur serveur

---

### 5. **DELETE** `/:examId` - Supprimer un examen

**Description** : Supprime un examen et tous ses fichiers associés

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Réponse (200 OK)** :
```json
{
  "message": "Examen complémentaire supprimé avec succès",
  "examId": 6,
  "filesDeleted": 3
}
```

**Erreurs possibles** :
- `404` : Examen non trouvé ou n'appartient pas à votre patient
- `500` : Erreur serveur

---

### 6. **POST** `/:examId/files` - Upload un fichier

**Description** : Upload un fichier (PDF, image, DICOM) pour un examen

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data** :
```
file: <binary file data>
```

**Types de fichiers acceptés** :
- PDF : `application/pdf`
- Images : `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- DICOM : `application/dicom`, `application/x-dicom`, `.dcm`

**Taille maximale** : 50 MB

**Réponse (201 Created)** :
```json
{
  "message": "Fichier uploadé avec succès",
  "file": {
    "id": 4,
    "examId": 1,
    "fileName": "scanner_thorax.pdf",
    "fileUrl": "uploads/exams/exam-1705318234567-987654321.pdf",
    "fileType": "application/pdf",
    "fileSize": 3145728,
    "uploadDate": "2024-01-15T10:10:34.567Z"
  },
  "exam": {
    "id": 1,
    "type": "Scanner thoracique",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont"
    }
  }
}
```

**Erreurs possibles** :
- `400` : Aucun fichier uploadé
- `400` : Type de fichier invalide
- `413` : Fichier trop volumineux (> 50MB)
- `404` : Examen non trouvé ou n'appartient pas à votre patient
- `500` : Erreur serveur

---

### 7. **DELETE** `/files/:fileId` - Supprimer un fichier

**Description** : Supprime un fichier spécifique d'un examen

**Headers requis** :
```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Réponse (200 OK)** :
```json
{
  "message": "Fichier supprimé avec succès",
  "fileId": 4,
  "fileName": "scanner_thorax.pdf",
  "exam": {
    "id": 1,
    "type": "Scanner thoracique"
  }
}
```

**Erreurs possibles** :
- `404` : Fichier non trouvé ou n'appartient pas à votre patient
- `500` : Erreur serveur

---

## 🗂️ Structure de la Base de Données

### Table `ComplementaryExam`
```prisma
model ComplementaryExam {
  id          Int         @id @default(autoincrement())
  patientId   Int
  type        String      // Type d'examen
  description String      @db.Text
  date        DateTime    // Date de l'examen
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  files       ExamFile[]
}
```

### Table `ExamFile`
```prisma
model ExamFile {
  id         Int      @id @default(autoincrement())
  examId     Int
  fileName   String
  fileUrl    String
  fileType   String   // MIME type
  fileSize   Int      // Taille en octets
  uploadDate DateTime @default(now())
  exam       ComplementaryExam @relation(fields: [examId], references: [id], onDelete: Cascade)
}
```

---

## 🔒 Sécurité et Permissions

### Authentification
- Tous les endpoints nécessitent un token JWT valide via `verifyAccessToken`
- Le token doit être envoyé dans le header : `Authorization: Bearer <token>`

### Autorisation
- Un médecin ne peut accéder qu'aux examens de SES patients
- Vérification automatique via `medecinId` extrait du token JWT
- Toute tentative d'accès à des données d'autres médecins retourne `404`

### Upload de Fichiers
- Validation stricte des types MIME
- Limite de taille : 50 MB
- Stockage sécurisé dans `uploads/exams/`
- Nettoyage automatique en cas d'erreur

---

## 📊 Statistiques Calculées

Les statistiques suivantes sont automatiquement calculées pour chaque patient :

```javascript
{
  total: 5,              // Nombre total d'examens
  totalFiles: 8,         // Nombre total de fichiers
  types: [               // Liste des types d'examens uniques
    "Échographie rénale",
    "Scanner thoracique"
  ],
  recentExams: 2         // Examens du dernier mois
}
```

---

## 🧪 Tests avec cURL

### 1. Récupérer tous les examens d'un patient
```bash
curl -X GET \
  http://localhost:3000/medecin/complementary-exams/patient/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Récupérer un examen spécifique
```bash
curl -X GET \
  http://localhost:3000/medecin/complementary-exams/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Créer un nouvel examen
```bash
curl -X POST \
  http://localhost:3000/medecin/complementary-exams \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "type": "IRM cérébrale",
    "description": "IRM cérébrale avec gadolinium",
    "date": "2024-03-15T14:00:00.000Z"
  }'
```

### 4. Modifier un examen
```bash
curl -X PUT \
  http://localhost:3000/medecin/complementary-exams/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "IRM cérébrale avec injection de gadolinium - Contrôle post-traitement"
  }'
```

### 5. Supprimer un examen
```bash
curl -X DELETE \
  http://localhost:3000/medecin/complementary-exams/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Upload un fichier
```bash
curl -X POST \
  http://localhost:3000/medecin/complementary-exams/1/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/chemin/vers/votre/fichier.pdf"
```

### 7. Supprimer un fichier
```bash
curl -X DELETE \
  http://localhost:3000/medecin/complementary-exams/files/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎯 Exemples d'Intégration Frontend

### Exemple React Component
Voir le fichier `EXAMENS_COMPLEMENTAIRES_API.md` pour un composant React complet avec :
- Récupération des examens
- Affichage avec statistiques
- Création et modification
- Upload de fichiers
- Gestion des erreurs
- État de chargement

---

## 📝 Types d'Examens Courants

Voici quelques exemples de types d'examens que vous pouvez utiliser :

### Imagerie
- Échographie abdominale
- Échographie rénale
- Échographie pelvienne
- Scanner thoracique
- Scanner abdominal
- Scanner cérébral
- IRM cérébrale
- IRM rachidienne
- IRM articulaire
- Radiographie thoracique
- Mammographie

### Analyses Biologiques
- Bilan sanguin complet
- Bilan hépatique
- Bilan rénal
- Bilan thyroïdien
- Bilan lipidique
- Glycémie à jeun

### Examens Fonctionnels
- Électrocardiogramme (ECG)
- Échocardiographie
- Épreuve d'effort
- Spirométrie
- Endoscopie digestive
- Coloscopie

---

## ✅ Checklist de Configuration

- [x] Modèles Prisma définis (`ComplementaryExam`, `ExamFile`)
- [x] Migration de base de données effectuée
- [x] Routes configurées dans `/routes/complementaryExams.js`
- [x] Contrôleurs implémentés dans `/controllers/complementaryExamController.js`
- [x] Middleware d'authentification (`verifyAccessToken`)
- [x] Configuration Multer pour upload de fichiers
- [x] Dossier `uploads/exams/` créé
- [x] Routes enregistrées dans `app.js`
- [x] Localisation française complète
- [x] Documentation API complète

---

## 🚀 Déploiement

### 1. Créer le dossier uploads
```bash
mkdir -p uploads/exams
chmod 755 uploads/exams
```

### 2. Enregistrer les routes dans app.js
```javascript
import complementaryExamsRoutes from './routes/complementaryExams.js';

// Routes
app.use('/medecin/complementary-exams', complementaryExamsRoutes);
```

### 3. Redémarrer le serveur
```bash
npm run dev
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `EXAMENS_COMPLEMENTAIRES_API.md` - Documentation API complète avec exemples React
- `prisma/schema.prisma` - Schéma de base de données
- `src/routes/complementaryExams.js` - Définition des routes
- `src/controllers/complementaryExamController.js` - Logique métier

---

## 🎉 Résumé

Le système d'examens complémentaires est **100% fonctionnel** et prêt à l'emploi. Il inclut :

✅ 7 endpoints RESTful complets  
✅ Authentification et autorisation JWT  
✅ Upload de fichiers jusqu'à 50MB  
✅ Statistiques automatiques  
✅ Messages en français  
✅ Gestion des erreurs robuste  
✅ Documentation complète  
✅ Exemples de code prêts à l'emploi  

**Vous pouvez commencer à l'utiliser immédiatement !**

---

**Date de mise à jour** : 12 novembre 2024  
**Commit** : a9669e7  
**Auteur** : GenSpark AI Developer
