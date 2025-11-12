# 💊 API Ordonnances - Documentation Prisma/PostgreSQL

## 📋 Vue d'ensemble

Cette documentation décrit les endpoints API pour la gestion des ordonnances médicales avec Prisma et PostgreSQL.

---

## 🔐 Endpoints Disponibles

### 1. **POST** `/medecin/ordonnances`
Crée une nouvelle ordonnance pour un patient.

### 2. **GET** `/medecin/ordonnances`
Récupère toutes les ordonnances du médecin (avec filtres optionnels).

### 3. **GET** `/medecin/ordonnances/:id`
Récupère une ordonnance spécifique par son ID.

### 4. **GET** `/medecin/ordonnances/patient/:patientId`
Récupère toutes les ordonnances d'un patient spécifique.

### 5. **PUT** `/medecin/ordonnances/:id`
Met à jour une ordonnance existante.

### 6. **DELETE** `/medecin/ordonnances/:id`
Supprime une ordonnance.

---

## 1️⃣ Créer une Ordonnance

### **POST** `/medecin/ordonnances`

#### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Body (JSON)
```json
{
  "patientId": 1,
  "dateValidite": "2024-12-12T00:00:00.000Z",
  "note": "Observations et recommandations du médecin",
  "rendezVousId": 5,
  "medicaments": [
    {
      "medicamentId": 10,
      "posologie": "3 fois par jour",
      "duree": "7 jours",
      "instructions": "Après les repas"
    },
    {
      "medicamentData": {
        "nom": "Médicament personnalisé",
        "dosage": "500mg",
        "forme": "Gélule",
        "fabricant": "Laboratoire XYZ",
        "moleculeMere": "Paracétamol",
        "type": "Antalgique",
        "frequence": "2 fois par jour"
      },
      "posologie": "2 fois par jour",
      "duree": "10 jours",
      "instructions": "Le matin et le soir"
    }
  ]
}
```

#### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `patientId` | Integer | ✅ Oui | ID du patient |
| `dateValidite` | String (ISO 8601) | ❌ Non | Date de validité de l'ordonnance |
| `note` | String | ❌ Non | Observations et recommandations |
| `rendezVousId` | Integer | ❌ Non | ID du rendez-vous associé |
| `medicaments` | Array | ✅ Oui | Liste des médicaments (min: 1) |

#### Paramètres d'un Médicament

**Option 1: Médicament existant**
```json
{
  "medicamentId": 10,
  "posologie": "3 fois par jour",
  "duree": "7 jours",
  "instructions": "Après les repas"
}
```

**Option 2: Nouveau médicament (créera une demande)**
```json
{
  "medicamentData": {
    "nom": "Nom du médicament",
    "dosage": "500mg",
    "forme": "Comprimé",
    "fabricant": "Laboratoire",
    "moleculeMere": "Molécule active",
    "type": "Type de médicament",
    "frequence": "2 fois par jour"
  },
  "posologie": "2 fois par jour",
  "duree": "10 jours",
  "instructions": "Instructions spéciales"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `medicamentId` | Integer | ⚠️ Conditionnel | ID du médicament (si existant) |
| `medicamentData` | Object | ⚠️ Conditionnel | Données du nouveau médicament |
| `posologie` | String | ✅ Oui | Fréquence de prise |
| `duree` | String | ❌ Non | Durée du traitement |
| `instructions` | String | ❌ Non | Instructions spéciales |

#### Réponse (201 Created)

```json
{
  "message": "Ordonnance créée avec succès",
  "ordonnance": {
    "id": 1,
    "patientId": 1,
    "medecinId": 2,
    "rendezVousId": 5,
    "dateCreation": "2024-11-12T10:30:00.000Z",
    "dateValidite": "2024-12-12T00:00:00.000Z",
    "note": "Observations et recommandations du médecin",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont",
      "phoneNumber": "+33612345678"
    },
    "medicaments": [
      {
        "medicament": {
          "id": 10,
          "nom": "Doliprane",
          "dosage": "1000mg",
          "forme": "Comprimé",
          "moleculeMere": "Paracétamol",
          "type": "Antalgique"
        },
        "posologie": "3 fois par jour",
        "duree": "7 jours",
        "instructions": "Après les repas"
      }
    ]
  },
  "demandesCreated": [
    {
      "id": 15,
      "nom": "Médicament personnalisé",
      "dosage": "500mg",
      "status": "EnAttente"
    }
  ]
}
```

#### Réponse (202 Accepted) - Si seulement des demandes

```json
{
  "message": "Demandes de médicaments créées. L'ordonnance sera disponible après validation.",
  "demandes": [
    {
      "id": 15,
      "nom": "Médicament personnalisé",
      "dosage": "500mg",
      "forme": "Gélule",
      "status": "EnAttente"
    }
  ],
  "ordonnanceCreated": false
}
```

#### Erreurs

**400 Bad Request**
```json
{
  "message": "Patient ID et au moins un médicament sont requis"
}
```

**404 Not Found**
```json
{
  "message": "Patient non trouvé ou n'appartient pas à ce médecin"
}
```

---

## 2️⃣ Récupérer les Ordonnances

### **GET** `/medecin/ordonnances`

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Query Parameters (optionnels)

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `patientId` | Integer | Filtrer par patient | `?patientId=1` |
| `startDate` | String (ISO 8601) | Date de début | `?startDate=2024-01-01` |
| `endDate` | String (ISO 8601) | Date de fin | `?endDate=2024-12-31` |
| `limit` | Integer | Nombre max de résultats | `?limit=20` (défaut: 50) |

#### Exemples de Requêtes

```bash
# Toutes les ordonnances
GET /medecin/ordonnances

# Ordonnances d'un patient spécifique
GET /medecin/ordonnances?patientId=1

# Ordonnances d'une période
GET /medecin/ordonnances?startDate=2024-01-01&endDate=2024-12-31

# Combinaison de filtres
GET /medecin/ordonnances?patientId=1&limit=10
```

#### Réponse (200 OK)

```json
{
  "ordonnances": [
    {
      "id": 1,
      "patientId": 1,
      "medecinId": 2,
      "rendezVousId": 5,
      "dateCreation": "2024-11-12T10:30:00.000Z",
      "dateValidite": "2024-12-12T00:00:00.000Z",
      "note": "Observations",
      "patient": {
        "id": 1,
        "fullName": "Jean Dupont",
        "phoneNumber": "+33612345678",
        "dateOfBirth": "1980-05-15T00:00:00.000Z"
      },
      "medicaments": [
        {
          "medicament": {
            "id": 10,
            "nom": "Doliprane",
            "dosage": "1000mg",
            "forme": "Comprimé",
            "moleculeMere": "Paracétamol",
            "type": "Antalgique"
          },
          "posologie": "3 fois par jour",
          "duree": "7 jours",
          "instructions": "Après les repas"
        }
      ],
      "rendezVous": {
        "id": 5,
        "date": "2024-11-12T09:00:00.000Z",
        "state": "Completed"
      }
    }
  ],
  "count": 1,
  "stats": {
    "total": 150,
    "thisMonth": 12,
    "today": 3
  },
  "message": "Ordonnances récupérées avec succès"
}
```

---

## 3️⃣ Récupérer une Ordonnance Spécifique

### **GET** `/medecin/ordonnances/:id`

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Integer | ID de l'ordonnance |

#### Exemple
```bash
GET /medecin/ordonnances/1
```

#### Réponse (200 OK)

```json
{
  "ordonnance": {
    "id": 1,
    "patientId": 1,
    "medecinId": 2,
    "rendezVousId": 5,
    "dateCreation": "2024-11-12T10:30:00.000Z",
    "dateValidite": "2024-12-12T00:00:00.000Z",
    "note": "Observations détaillées",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont",
      "phoneNumber": "+33612345678",
      "dateOfBirth": "1980-05-15T00:00:00.000Z",
      "gender": "Masculin",
      "maladieChronique": "Hypertension"
    },
    "medecin": {
      "id": 2,
      "fullName": "Dr. Martin LEROY",
      "speciality": "Médecine Générale",
      "phoneNumber": "+33687654321"
    },
    "medicaments": [
      {
        "medicament": {
          "id": 10,
          "nom": "Doliprane",
          "dosage": "1000mg",
          "forme": "Comprimé",
          "fabricant": "Sanofi",
          "moleculeMere": "Paracétamol",
          "type": "Antalgique"
        },
        "posologie": "3 fois par jour",
        "duree": "7 jours",
        "instructions": "Après les repas"
      }
    ],
    "rendezVous": {
      "id": 5,
      "date": "2024-11-12T09:00:00.000Z",
      "state": "Completed"
    }
  }
}
```

#### Erreurs

**400 Bad Request**
```json
{
  "message": "ID ordonnance invalide"
}
```

**404 Not Found**
```json
{
  "message": "Ordonnance non trouvée ou n'appartient pas à ce médecin"
}
```

---

## 4️⃣ Récupérer les Ordonnances d'un Patient

### **GET** `/medecin/ordonnances/patient/:patientId`

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `patientId` | Integer | ID du patient |

#### Exemple
```bash
GET /medecin/ordonnances/patient/1
```

#### Réponse (200 OK)

```json
{
  "ordonnances": [
    {
      "id": 1,
      "dateCreation": "2024-11-12T10:30:00.000Z",
      "dateValidite": "2024-12-12T00:00:00.000Z",
      "note": "Traitement de fond",
      "medicaments": [...]
    },
    {
      "id": 2,
      "dateCreation": "2024-10-15T14:20:00.000Z",
      "dateValidite": "2024-11-15T00:00:00.000Z",
      "note": "Traitement aigu",
      "medicaments": [...]
    }
  ],
  "patient": {
    "id": 1,
    "fullName": "Jean Dupont",
    "phoneNumber": "+33612345678"
  }
}
```

#### Erreurs

**400 Bad Request**
```json
{
  "message": "ID patient invalide"
}
```

**404 Not Found**
```json
{
  "message": "Patient non trouvé ou n'appartient pas à ce médecin"
}
```

---

## 5️⃣ Mettre à Jour une Ordonnance

### **PUT** `/medecin/ordonnances/:id`

#### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Integer | ID de l'ordonnance |

#### Body (JSON)

```json
{
  "dateValidite": "2025-01-12T00:00:00.000Z",
  "note": "Note modifiée",
  "medicaments": [
    {
      "medicamentId": 10,
      "posologie": "2 fois par jour",
      "duree": "14 jours",
      "instructions": "Le matin et le soir"
    },
    {
      "medicamentId": 15,
      "posologie": "1 fois par jour",
      "duree": "30 jours",
      "instructions": "Avant le coucher"
    }
  ]
}
```

#### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `dateValidite` | String (ISO 8601) | ❌ Non | Nouvelle date de validité |
| `note` | String | ❌ Non | Note mise à jour |
| `medicaments` | Array | ❌ Non | Nouvelle liste de médicaments (remplace l'ancienne) |

#### Réponse (200 OK)

```json
{
  "message": "Ordonnance modifiée avec succès",
  "ordonnance": {
    "id": 1,
    "patientId": 1,
    "medecinId": 2,
    "dateCreation": "2024-11-12T10:30:00.000Z",
    "dateValidite": "2025-01-12T00:00:00.000Z",
    "note": "Note modifiée",
    "patient": {
      "id": 1,
      "fullName": "Jean Dupont",
      "phoneNumber": "+33612345678"
    },
    "medicaments": [
      {
        "medicament": {
          "id": 10,
          "nom": "Doliprane",
          "dosage": "1000mg",
          "forme": "Comprimé",
          "moleculeMere": "Paracétamol",
          "type": "Antalgique"
        },
        "posologie": "2 fois par jour",
        "duree": "14 jours",
        "instructions": "Le matin et le soir"
      }
    ]
  }
}
```

#### Erreurs

**400 Bad Request**
```json
{
  "message": "ID ordonnance invalide"
}
```

**404 Not Found**
```json
{
  "message": "Ordonnance non trouvée ou n'appartient pas à ce médecin"
}
```

---

## 6️⃣ Supprimer une Ordonnance

### **DELETE** `/medecin/ordonnances/:id`

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Integer | ID de l'ordonnance |

#### Exemple
```bash
DELETE /medecin/ordonnances/1
```

#### Réponse (200 OK)

```json
{
  "message": "Ordonnance supprimée avec succès",
  "ordonnanceId": 1
}
```

#### Erreurs

**400 Bad Request**
```json
{
  "message": "ID ordonnance invalide"
}
```

**404 Not Found**
```json
{
  "message": "Ordonnance non trouvée ou n'appartient pas à ce médecin"
}
```

---

## 🧪 Tests avec cURL

### Créer une Ordonnance
```bash
curl -X POST http://localhost:4000/medecin/ordonnances \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "dateValidite": "2024-12-12T00:00:00.000Z",
    "note": "Repos recommandé",
    "medicaments": [
      {
        "medicamentId": 10,
        "posologie": "3 fois par jour",
        "duree": "7 jours",
        "instructions": "Après les repas"
      }
    ]
  }'
```

### Lister Toutes les Ordonnances
```bash
curl -X GET http://localhost:4000/medecin/ordonnances \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Récupérer une Ordonnance Spécifique
```bash
curl -X GET http://localhost:4000/medecin/ordonnances/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Récupérer les Ordonnances d'un Patient
```bash
curl -X GET http://localhost:4000/medecin/ordonnances/patient/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mettre à Jour une Ordonnance
```bash
curl -X PUT http://localhost:4000/medecin/ordonnances/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Note mise à jour",
    "dateValidite": "2025-01-12T00:00:00.000Z"
  }'
```

### Supprimer une Ordonnance
```bash
curl -X DELETE http://localhost:4000/medecin/ordonnances/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🗄️ Modèle Prisma

```prisma
model Ordonnance {
  id                Int                   @id @default(autoincrement())
  patientId         Int
  medecinId         Int
  rendezVousId      Int?
  dateCreation      DateTime              @default(now())
  dateValidite      DateTime?
  note              String?               @db.Text
  
  patient           Patient               @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medecin           Medecin               @relation("MedecinOrdonnances", fields: [medecinId], references: [id])
  rendezVous        RendezVous?           @relation(fields: [rendezVousId], references: [id], onDelete: SetNull)
  medicaments       OrdonnanceMedicament[]
  
  @@index([patientId])
  @@index([medecinId])
  @@index([dateCreation])
}

model OrdonnanceMedicament {
  id              Int         @id @default(autoincrement())
  ordonnanceId    Int
  medicamentId    Int
  posologie       String
  duree           String?
  instructions    String?     @db.Text
  
  ordonnance      Ordonnance  @relation(fields: [ordonnanceId], references: [id], onDelete: Cascade)
  medicament      Medicament  @relation(fields: [medicamentId], references: [id])
  
  @@unique([ordonnanceId, medicamentId])
}

model Medicament {
  id                      Int                     @id @default(autoincrement())
  nom                     String
  dosage                  String
  forme                   String
  fabricant               String
  moleculeMere            String
  type                    String
  frequence               String                  @default("3 fois par jour")
  medecinId               Int?
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt
  
  ordonnanceMedicaments   OrdonnanceMedicament[]
  medecin                 Medecin?                @relation(fields: [medecinId], references: [id])
  
  @@unique([nom, dosage, forme])
}
```

---

## 🔒 Sécurité

### Authentification
- Toutes les routes nécessitent un JWT token valide
- Le token doit être envoyé dans le header `Authorization: Bearer <token>`

### Authorization
- Seul le médecin propriétaire peut accéder à ses ordonnances
- Vérification automatique du `medecinId` via le token JWT

### Validation
- Validation des IDs (entiers positifs)
- Validation de l'existence du patient
- Validation de l'existence des médicaments
- Au moins un médicament requis par ordonnance

---

## 📊 Codes de Statut HTTP

| Code | Signification | Utilisation |
|------|---------------|-------------|
| 200 | OK | Requête GET, PUT, DELETE réussie |
| 201 | Created | Ordonnance créée avec succès |
| 202 | Accepted | Demandes créées (médicaments en attente) |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 404 | Not Found | Ressource non trouvée |
| 500 | Internal Server Error | Erreur serveur |

---

## ✅ Checklist d'Utilisation

### Backend
- [x] Routes configurées dans `src/routes/ordonnances.js`
- [x] Controller implémenté dans `src/controllers/ordonnanceController.js`
- [x] Middleware d'authentification (`verifyAccessToken`)
- [x] Modèles Prisma créés et migrés
- [x] Validation des données
- [x] Gestion des erreurs

### Frontend
- [ ] Importer `baseURL` depuis config
- [ ] Récupérer le token depuis localStorage
- [ ] Utiliser `fetch()` pour appeler les endpoints
- [ ] Gérer les réponses (201, 202, 400, 404, 500)
- [ ] Afficher les messages d'erreur à l'utilisateur
- [ ] Recharger les données après création/modification

---

## 📞 Support

Pour plus d'informations:
- Consultez `MEDICAMENTS_ORDONNANCES_GUIDE.md` pour le système complet
- Consultez `FIX_ORDONNANCE_STORAGE.md` pour l'intégration frontend
- Vérifiez les logs serveur: `tail -f server.log`

---

**Status:** ✅ Tous les endpoints sont implémentés et fonctionnels  
**Backend:** ✅ Prisma + PostgreSQL  
**Date:** 2024-11-12
