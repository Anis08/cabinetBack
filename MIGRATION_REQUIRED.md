# ⚠️ MIGRATION REQUISE - Nouvelles Fonctionnalités Désactivées Temporairement

## 🚨 Statut Actuel

Les nouvelles fonctionnalités suivantes ont été **temporairement désactivées** car la migration de base de données n'a pas encore été exécutée:

### Fonctionnalités Désactivées:
- ❌ Champs `email` et `address` dans Patient
- ❌ Gestion des examens complémentaires (ComplementaryExam)
- ❌ Upload de fichiers pour les examens
- ❌ Routes `/medecin/complementary-exams/*`
- ❌ Endpoints update/delete patient

### Fonctionnalités Actives:
- ✅ Toutes les autres fonctionnalités existantes
- ✅ Profil patient (sans email/address)
- ✅ Rendez-vous
- ✅ Constantes vitales
- ✅ Tests biologiques
- ✅ Publicités

---

## 🔧 Comment Activer les Nouvelles Fonctionnalités

### Étape 1: Configurer DATABASE_URL

Créez un fichier `.env` à la racine du projet:

```bash
cd /home/user/webapp
nano .env
```

Ajoutez votre URL de connexion PostgreSQL:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=4000
ACCESS_TOKEN_SECRET=votre_secret_jwt
REFRESH_TOKEN_SECRET=votre_secret_refresh_jwt
```

**Exemple:**
```env
DATABASE_URL="postgresql://postgres:motdepasse@localhost:5432/cabinet_medical?schema=public"
PORT=4000
ACCESS_TOKEN_SECRET=mon_secret_access_token_123
REFRESH_TOKEN_SECRET=mon_secret_refresh_token_456
```

### Étape 2: Exécuter la Migration

```bash
cd /home/user/webapp
npx prisma migrate dev --name add_complementary_exams_and_patient_fields
```

Cette commande va:
- Ajouter les champs `email` et `address` à la table Patient
- Créer la table `ComplementaryExam`
- Créer la table `ExamFile`
- Ajouter les relations CASCADE pour la suppression

### Étape 3: Réactiver les Fonctionnalités

Après la migration réussie, dé-commentez le code:

#### A. Dans `src/controllers/medecinController.js`

**Ligne ~982 (fonction getPatientProfile):**
```javascript
// Décommenter ces lignes:
email: true,
address: true,
```

**Ligne ~1084 (fonction updatePatient):**
```javascript
// Décommenter ces lignes:
email: true,
address: true,
```

#### B. Dans `src/server.js`

**Ligne ~36:**
```javascript
// Décommenter cette ligne:
app.use('/medecin/complementary-exams', complementaryExamsRoutes);
```

### Étape 4: Redémarrer le Serveur

```bash
npm run dev
```

---

## 🧪 Vérification

Après avoir réactivé les fonctionnalités, testez:

### 1. Vérifier les Champs Patient
```bash
curl -X GET http://localhost:4000/medecin/profile-patient/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Vous devriez voir `email` et `address` dans la réponse.

### 2. Tester les Examens Complémentaires
```bash
curl -X GET http://localhost:4000/medecin/complementary-exams/patient/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Devrait retourner `{"exams": []}`

### 3. Tester Update Patient
```bash
curl -X PUT http://localhost:4000/medecin/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Patient",
    "dateOfBirth": "1990-01-01",
    "gender": "Homme",
    "email": "test@example.com",
    "address": "123 Rue Test"
  }'
```

---

## 📁 Fichiers Modifiés Temporairement

Les fichiers suivants contiennent du code commenté qui doit être réactivé après la migration:

1. `src/controllers/medecinController.js`
   - Lignes ~982-983 (email, address dans getPatientProfile)
   - Lignes ~1084-1085 (email, address dans updatePatient)

2. `src/server.js`
   - Ligne ~36 (route complementary-exams)

---

## 🚀 État Actuel du Serveur

**Sans Migration:**
- ✅ Le serveur démarre normalement
- ✅ Toutes les fonctionnalités existantes fonctionnent
- ❌ Les nouvelles fonctionnalités sont désactivées

**Après Migration:**
- ✅ Toutes les fonctionnalités activées
- ✅ Email et Address disponibles
- ✅ Examens complémentaires fonctionnels
- ✅ Update/Delete patient fonctionnels

---

## 🔍 Vérifier si la Migration est Nécessaire

Pour vérifier si votre base de données a déjà les nouveaux champs:

```sql
-- Connectez-vous à PostgreSQL et exécutez:
\d patients

-- Si vous voyez les colonnes 'email' et 'address', la migration a déjà été faite
-- Si vous ne les voyez pas, vous devez exécuter la migration
```

---

## ⚠️ Important

**NE PAS** exécuter la migration en production sans backup!

1. Faites un backup de votre base de données
2. Testez la migration sur une base de données de développement d'abord
3. Vérifiez que tout fonctionne
4. Ensuite, appliquez en production

---

## 💡 Alternative: Rollback

Si vous ne voulez pas utiliser les nouvelles fonctionnalités, vous pouvez:

1. Garder le code commenté tel quel
2. Ou supprimer complètement les nouveaux fichiers:
   - `src/controllers/complementaryExamController.js`
   - `src/routes/complementaryExams.js`
   - Les nouvelles tables dans `prisma/schema.prisma`

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifiez que DATABASE_URL est correct dans .env
2. Vérifiez que PostgreSQL est démarré
3. Vérifiez les logs de migration pour les erreurs
4. Consultez `PATIENT_MANAGEMENT_API.md` pour plus de détails

---

**Status:** ⏳ En Attente de Migration  
**Date:** 10 Novembre 2024
