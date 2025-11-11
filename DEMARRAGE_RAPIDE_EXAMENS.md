# 🚀 Démarrage Rapide - Examens Complémentaires

## ⚡ En 3 Étapes (10 minutes)

### Étape 1: Configurer DATABASE_URL (2 minutes)

```bash
cd /home/user/webapp
nano .env
```

Coller:
```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/VOTRE_BASE_DE_DONNEES?schema=public"
PORT=4000
ACCESS_TOKEN_SECRET=votre_secret_jwt
REFRESH_TOKEN_SECRET=votre_secret_refresh
```

**Remplacez:**
- `VOTRE_MOT_DE_PASSE` par le mot de passe PostgreSQL
- `VOTRE_BASE_DE_DONNEES` par le nom de votre base

**Sauvegarder:** Ctrl+X, puis Y, puis Enter

---

### Étape 2: Exécuter la Migration (1 minute)

```bash
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

**Résultat attendu:**
```
✔ Generated Prisma Client
✔ Applied migration: add_complementary_exams_and_patient_fields
```

---

### Étape 3: Redémarrer le Serveur (30 secondes)

```bash
npm run dev
```

**Résultat attendu:**
```
✔ Server running on port 4000
✔ WebSocket server running
```

---

## ✅ C'est Prêt!

### Backend

Les endpoints suivants sont maintenant actifs:

```
GET    /medecin/complementary-exams/patient/:patientId
POST   /medecin/complementary-exams
PUT    /medecin/complementary-exams/:examId
DELETE /medecin/complementary-exams/:examId
POST   /medecin/complementary-exams/:examId/files
DELETE /medecin/complementary-exams/files/:fileId
```

### Frontend

Copiez le code d'intégration depuis `ACTIVER_EXAMENS_COMPLEMENTAIRES.md` section "Étape 5" dans votre `PatientProfile.jsx`.

**Les 6 fonctions à modifier:**
1. `useEffect` - Charger les examens
2. `handleSaveExam` - Créer/modifier
3. `handleDeleteExam` - Supprimer examen
4. `handleFileUploadForExam` - Upload fichier
5. `handleDeleteFile` - Supprimer fichier
6. `handlePreviewFile` + `handleDownloadFile` - Preview/Download

---

## 🧪 Test Rapide

### Test 1: Créer un Examen
```bash
curl -X POST http://localhost:4000/medecin/complementary-exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "type": "Échographie rénale",
    "description": "Test de création",
    "date": "2024-11-10"
  }'
```

### Test 2: Lister les Examens
```bash
curl -X GET http://localhost:4000/medecin/complementary-exams/patient/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Checklist

- [ ] .env créé avec DATABASE_URL
- [ ] Migration exécutée avec succès
- [ ] Serveur redémarré
- [ ] Test API fonctionne
- [ ] Code frontend intégré
- [ ] Test création d'examen dans l'app
- [ ] Test upload de fichier dans l'app

---

## 🆘 Problèmes?

### Erreur "Can't reach database server"
```bash
sudo systemctl start postgresql
```

### Erreur "Unknown field email"
```bash
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

### Fichiers ne s'uploadent pas
```bash
mkdir -p uploads/exams
chmod 755 uploads/exams
```

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- **ACTIVER_EXAMENS_COMPLEMENTAIRES.md** - Guide complet
- **PATIENT_MANAGEMENT_API.md** - Documentation API
- **FRONTEND_INTEGRATION_GUIDE.md** - Code frontend

---

**🎉 Prêt à utiliser les examens complémentaires avec sauvegarde en base de données!**
