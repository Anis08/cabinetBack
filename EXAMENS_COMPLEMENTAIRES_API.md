# API Examens Complémentaires - Documentation Complète

## 📋 Vue d'ensemble

L'API des examens complémentaires permet de gérer tous les types d'examens médicaux avec upload de fichiers (PDF, images, DICOM).

## 🗂️ Modèles de Données

### ComplementaryExam
```prisma
model ComplementaryExam {
  id          Int         @id @default(autoincrement())
  patientId   Int
  type        String      // Type d'examen (Échographie, Scanner, etc.)
  description String      @db.Text
  date        DateTime
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  files       ExamFile[]
}
```

### ExamFile
```prisma
model ExamFile {
  id         Int      @id @default(autoincrement())
  examId     Int
  fileName   String
  fileUrl    String
  fileType   String   // MIME type
  fileSize   Int      // Taille en bytes
  uploadDate DateTime @default(now())
  
  exam       ComplementaryExam @relation(fields: [examId], references: [id], onDelete: Cascade)
}
```

## 🔗 Endpoints Disponibles

### 1. GET /medecin/complementary-exams/patient/:patientId
**Récupérer tous les examens d'un patient**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
```

**Réponse (200 OK):**
```json
{
  "exams": [
    {
      "id": 1,
      "patientId": 5,
      "type": "Échographie rénale",
      "description": "Échographie des reins pour vérifier la présence de calculs",
      "date": "2024-11-10T14:30:00.000Z",
      "createdAt": "2024-11-10T10:00:00.000Z",
      "updatedAt": "2024-11-10T10:00:00.000Z",
      "files": [
        {
          "id": 1,
          "examId": 1,
          "fileName": "echo_rein_gauche.jpg",
          "fileUrl": "uploads/exams/exam-1731243000000-123456789.jpg",
          "fileType": "image/jpeg",
          "fileSize": 245678,
          "uploadDate": "2024-11-10T14:35:00.000Z"
        },
        {
          "id": 2,
          "examId": 1,
          "fileName": "echo_rein_droit.jpg",
          "fileUrl": "uploads/exams/exam-1731243100000-987654321.jpg",
          "fileType": "image/jpeg",
          "fileSize": 238456,
          "uploadDate": "2024-11-10T14:36:00.000Z"
        }
      ]
    },
    {
      "id": 2,
      "patientId": 5,
      "type": "Scanner thoracique",
      "description": "Scanner du thorax pour investigation pulmonaire",
      "date": "2024-11-05T09:00:00.000Z",
      "createdAt": "2024-11-05T08:30:00.000Z",
      "updatedAt": "2024-11-05T08:30:00.000Z",
      "files": [
        {
          "id": 3,
          "examId": 2,
          "fileName": "scanner_thorax.pdf",
          "fileUrl": "uploads/exams/exam-1730800000000-456789123.pdf",
          "fileType": "application/pdf",
          "fileSize": 1245678,
          "uploadDate": "2024-11-05T09:15:00.000Z"
        }
      ]
    }
  ]
}
```

**Erreurs:**
- `404`: Patient non trouvé ou n'appartient pas au médecin
- `500`: Erreur serveur

---

### 2. POST /medecin/complementary-exams
**Créer un nouvel examen complémentaire**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "patientId": 5,
  "type": "Échographie rénale",
  "description": "Échographie des reins pour vérifier la présence de calculs rénaux",
  "date": "2024-11-10T14:30:00.000Z"
}
```

**Champs requis:**
- `patientId` (number) - ID du patient
- `type` (string) - Type d'examen
- `description` (string) - Description détaillée
- `date` (ISO string) - Date de l'examen

**Types d'examen courants:**
- Échographie abdominale
- Échographie rénale
- Scanner thoracique
- Scanner abdominal
- IRM cérébrale
- IRM lombaire
- Radiographie pulmonaire
- ECG
- Écho-doppler
- Mammographie
- Coloscopie
- Endoscopie

**Réponse (201 Created):**
```json
{
  "message": "Complementary exam created successfully",
  "exam": {
    "id": 3,
    "patientId": 5,
    "type": "Échographie rénale",
    "description": "Échographie des reins pour vérifier la présence de calculs rénaux",
    "date": "2024-11-10T14:30:00.000Z",
    "createdAt": "2024-11-12T16:45:00.000Z",
    "updatedAt": "2024-11-12T16:45:00.000Z",
    "files": []
  }
}
```

**Erreurs:**
- `400`: Champs requis manquants
- `404`: Patient non trouvé
- `500`: Erreur serveur

---

### 3. PUT /medecin/complementary-exams/:examId
**Modifier un examen complémentaire**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (tous les champs sont optionnels):**
```json
{
  "type": "Échographie rénale complète",
  "description": "Échographie bilatérale des reins avec doppler",
  "date": "2024-11-10T15:00:00.000Z"
}
```

**Réponse (200 OK):**
```json
{
  "message": "Complementary exam updated successfully",
  "exam": {
    "id": 3,
    "patientId": 5,
    "type": "Échographie rénale complète",
    "description": "Échographie bilatérale des reins avec doppler",
    "date": "2024-11-10T15:00:00.000Z",
    "createdAt": "2024-11-12T16:45:00.000Z",
    "updatedAt": "2024-11-12T16:50:00.000Z",
    "files": [...]
  }
}
```

**Erreurs:**
- `404`: Examen non trouvé
- `500`: Erreur serveur

---

### 4. DELETE /medecin/complementary-exams/:examId
**Supprimer un examen complémentaire**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
```

**Réponse (200 OK):**
```json
{
  "message": "Complementary exam deleted successfully",
  "examId": 3
}
```

**Notes:**
- Supprime automatiquement tous les fichiers associés (CASCADE)
- Supprime les fichiers du système de fichiers
- Impossible d'annuler cette action

**Erreurs:**
- `404`: Examen non trouvé
- `500`: Erreur serveur

---

### 5. POST /medecin/complementary-exams/:examId/files
**Uploader un fichier pour un examen**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [fichier binaire]
```

**Types de fichiers acceptés:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- DICOM: `application/dicom`, `application/x-dicom`, `.dcm`

**Taille maximale:** 50 MB

**Réponse (201 Created):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 4,
    "examId": 3,
    "fileName": "echo_rein_gauche.jpg",
    "fileUrl": "uploads/exams/exam-1731423000000-123456789.jpg",
    "fileType": "image/jpeg",
    "fileSize": 245678,
    "uploadDate": "2024-11-12T16:55:00.000Z"
  }
}
```

**Erreurs:**
- `400`: Aucun fichier uploadé ou type invalide
- `404`: Examen non trouvé
- `413`: Fichier trop volumineux (> 50MB)
- `500`: Erreur serveur

---

### 6. DELETE /medecin/complementary-exams/files/:fileId
**Supprimer un fichier d'un examen**

**Headers:**
```http
Authorization: Bearer {JWT_TOKEN}
```

**Réponse (200 OK):**
```json
{
  "message": "File deleted successfully",
  "fileId": 4
}
```

**Notes:**
- Supprime le fichier du système de fichiers
- Supprime l'enregistrement de la base de données

**Erreurs:**
- `404`: Fichier non trouvé
- `500`: Erreur serveur

---

## 🔒 Sécurité

### Authentification
Tous les endpoints nécessitent un JWT token valide:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vérifications
- Le patient doit appartenir au médecin authentifié
- Les examens ne peuvent être consultés que par le médecin du patient
- Les fichiers ne peuvent être supprimés que par le médecin propriétaire

---

## 📝 Exemples d'utilisation

### Exemple 1: Créer un examen avec upload de fichiers

**Étape 1: Créer l'examen**
```javascript
const createExam = async () => {
  const response = await fetch(`${baseURL}/medecin/complementary-exams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patientId: 5,
      type: 'Échographie rénale',
      description: 'Examen de contrôle',
      date: new Date().toISOString()
    })
  })
  
  const data = await response.json()
  return data.exam.id
}
```

**Étape 2: Uploader les fichiers**
```javascript
const uploadFile = async (examId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(
    `${baseURL}/medecin/complementary-exams/${examId}/files`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  )
  
  return await response.json()
}
```

### Exemple 2: Récupérer et afficher les examens

```javascript
const fetchExams = async (patientId) => {
  const response = await fetch(
    `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  
  const data = await response.json()
  return data.exams
}

// Affichage
const ExamsList = ({ exams }) => (
  <div>
    {exams.map(exam => (
      <div key={exam.id} className="exam-card">
        <h3>{exam.type}</h3>
        <p>{exam.description}</p>
        <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
        
        <div className="files">
          <h4>Fichiers ({exam.files.length})</h4>
          {exam.files.map(file => (
            <div key={file.id}>
              <a href={`${baseURL}/${file.fileUrl}`} target="_blank">
                {file.fileName}
              </a>
              <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)
```

### Exemple 3: Composant complet de gestion des examens

```javascript
import React, { useState, useEffect } from 'react'
import { baseURL } from '../config'

const ComplementaryExams = ({ patientId }) => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Récupérer les examens
  useEffect(() => {
    fetchExams()
  }, [patientId])

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${baseURL}/medecin/complementary-exams/patient/${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setExams(data.exams)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  // Créer un examen
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${baseURL}/medecin/complementary-exams`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patientId: parseInt(patientId),
            ...formData,
            date: new Date(formData.date).toISOString()
          })
        }
      )
      
      if (response.ok) {
        alert('Examen créé avec succès!')
        setShowForm(false)
        fetchExams()
        setFormData({
          type: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création')
    }
  }

  // Uploader un fichier
  const handleFileUpload = async (examId, file) => {
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(
        `${baseURL}/medecin/complementary-exams/${examId}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      )
      
      if (response.ok) {
        alert('Fichier uploadé avec succès!')
        fetchExams()
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'upload')
    }
  }

  // Supprimer un examen
  const handleDelete = async (examId) => {
    if (!confirm('Supprimer cet examen?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${baseURL}/medecin/complementary-exams/${examId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      if (response.ok) {
        alert('Examen supprimé')
        fetchExams()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>
        Nouvel Examen
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type d'examen"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
            required
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
          />
          
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
            required
          />
          
          <button type="submit">Créer</button>
        </form>
      )}

      <div>
        {exams.map(exam => (
          <div key={exam.id} className="exam-card">
            <h3>{exam.type}</h3>
            <p>{exam.description}</p>
            <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
            
            <div>
              <input
                type="file"
                onChange={e => handleFileUpload(exam.id, e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.dcm"
              />
            </div>
            
            <div>
              {exam.files.map(file => (
                <div key={file.id}>
                  <a href={`${baseURL}/${file.fileUrl}`} target="_blank">
                    {file.fileName}
                  </a>
                </div>
              ))}
            </div>
            
            <button onClick={() => handleDelete(exam.id)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComplementaryExams
```

---

## 🧪 Tests cURL

### Créer un examen
```bash
curl -X POST http://localhost:4000/medecin/complementary-exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 5,
    "type": "Échographie rénale",
    "description": "Examen de contrôle",
    "date": "2024-11-12T14:30:00.000Z"
  }'
```

### Récupérer les examens
```bash
curl -X GET http://localhost:4000/medecin/complementary-exams/patient/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Uploader un fichier
```bash
curl -X POST http://localhost:4000/medecin/complementary-exams/1/files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/echo.jpg"
```

### Supprimer un examen
```bash
curl -X DELETE http://localhost:4000/medecin/complementary-exams/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Structure des répertoires

```
project/
├── uploads/
│   └── exams/
│       ├── exam-1731243000000-123456789.jpg
│       ├── exam-1731243100000-987654321.pdf
│       └── ...
├── src/
│   ├── controllers/
│   │   └── complementaryExamController.js
│   └── routes/
│       └── complementaryExams.js
```

**Important:** Le dossier `uploads/exams/` doit exister et avoir les permissions d'écriture.

---

## ✅ Checklist d'implémentation

- [x] Modèles Prisma définis
- [x] Routes configurées
- [x] Controller implémenté
- [x] Upload de fichiers (Multer)
- [x] Authentification JWT
- [x] Validation des propriétaires
- [x] Suppression en cascade
- [x] Gestion des fichiers système
- [ ] Documentation API (ce fichier)
- [ ] Tests unitaires
- [ ] Interface frontend

---

## 🚀 Prochaines améliorations possibles

1. **Partage d'examens** - Partager avec d'autres médecins
2. **Annotations** - Annoter les images médicales
3. **Visionneuse DICOM** - Visualiser les images DICOM
4. **Export PDF** - Générer des rapports PDF
5. **Notifications** - Notifier le patient des résultats
6. **Historique** - Tracer les modifications
7. **Archivage** - Archiver les anciens examens
8. **Recherche** - Rechercher par type/date
9. **Statistiques** - Nombre d'examens par type
10. **Compression** - Compresser les images

---

**Créé le:** 2024-11-12  
**Version:** 1.0.0  
**Status:** ✅ Prêt à l'emploi
