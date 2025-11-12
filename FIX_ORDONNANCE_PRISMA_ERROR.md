# Fix: "Cannot read properties of undefined (reading 'create')" Error

## Error Message
```
Error creating ordonnance: TypeError: Cannot read properties of undefined (reading 'create')
    at createOrdonnance (file:///C:/Users/MSI/Downloads/Nouveau%20dossier%20(3)/cabinetBack-1/src/controllers/ordonnanceController.js:417:48)
```

## Root Cause

This error occurs because the **Prisma Client doesn't have the `Ordonnance` and `OrdonnanceMedicament` models** generated yet. This happens when:

1. The Prisma schema was updated with new models (Ordonnance, OrdonnanceMedicament, Medicament)
2. The Prisma Client wasn't regenerated after the schema changes
3. The database migration wasn't run to create the tables
4. The server is still using the old Prisma Client without these models

## Solution

Follow these steps in your local project directory:

### Step 1: Stop the Server

Press `Ctrl+C` in your terminal where the server is running, or:

```bash
# Windows PowerShell
Stop-Process -Name node -Force

# Linux/Mac
pkill -9 node
```

### Step 2: Check Your Prisma Schema

Make sure your `prisma/schema.prisma` file includes these models:

```prisma
// Médicaments
model Medicament {
  id              Int                   @id @default(autoincrement())
  nom             String
  dosage          String
  forme           String
  fabricant       String
  moleculeMere    String
  type            String
  frequence       String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  medecinId       Int?
  medecin         Medecin?              @relation(fields: [medecinId], references: [id], onDelete: SetNull)
  
  // Relations
  ordonnanceMedicaments OrdonnanceMedicament[]
  demandeMedicaments    DemandeMedicament[]    @relation("MedicamentDemandes")
  
  @@unique([nom, dosage, forme])
  @@index([nom])
  @@index([moleculeMere])
  @@index([type])
}

// Ordonnances
model Ordonnance {
  id                Int                   @id @default(autoincrement())
  patientId         Int
  medecinId         Int
  rendezVousId      Int?
  dateCreation      DateTime              @default(now())
  dateValidite      DateTime?
  note              String?               @db.Text
  
  // Relations
  patient           Patient               @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medecin           Medecin               @relation("MedecinOrdonnances", fields: [medecinId], references: [id])
  rendezVous        RendezVous?           @relation(fields: [rendezVousId], references: [id], onDelete: SetNull)
  medicaments       OrdonnanceMedicament[]
  
  @@index([patientId])
  @@index([medecinId])
  @@index([dateCreation])
}

// Table de liaison entre Ordonnance et Medicament
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

// Demandes d'ajout de médicament
enum DemandeMedicamentStatus {
  EnAttente
  Acceptee
  Rejetee
}

model DemandeMedicament {
  id              Int                     @id @default(autoincrement())
  nom             String
  dosage          String
  forme           String
  fabricant       String
  moleculeMere    String
  type            String
  frequence       String?
  medecinId       Int
  status          DemandeMedicamentStatus @default(EnAttente)
  motifRejet      String?
  medicamentId    Int?
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  traitePar       Int?
  dateTraitement  DateTime?
  
  medecin         Medecin                 @relation(fields: [medecinId], references: [id], onDelete: Cascade)
  medicament      Medicament?             @relation("MedicamentDemandes", fields: [medicamentId], references: [id], onDelete: SetNull)
  
  @@index([medecinId])
  @@index([status])
  @@index([createdAt])
}
```

**IMPORTANT:** Make sure the `Medecin` and `Patient` models also have these relations:

```prisma
model Medecin {
  // ... other fields ...
  ordonnances         Ordonnance[]         @relation("MedecinOrdonnances")
  demandeMedicaments  DemandeMedicament[]
  medicaments         Medicament[]
}

model Patient {
  // ... other fields ...
  ordonnances         Ordonnance[]
}

model RendezVous {
  // ... other fields ...
  ordonnances Ordonnance[]
}
```

### Step 3: Regenerate Prisma Client

```bash
npx prisma generate
```

You should see output like:
```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client in XXXms
```

### Step 4: Create and Run Database Migration

```bash
npx prisma migrate dev --name add_ordonnances_medicaments
```

This will:
- Create a new migration file
- Create the `Medicament`, `Ordonnance`, `OrdonnanceMedicament`, and `DemandeMedicament` tables in your database
- Apply all necessary foreign keys and indexes

**Note:** If you get a `DATABASE_URL` error, make sure you have a `.env` file in your project root with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_database?schema=public"
```

### Step 5: Restart the Server

```bash
npm start
```

Or if you're using nodemon:
```bash
npm run dev
```

### Step 6: Verify It Works

Test the ordonnance creation endpoint:

```bash
curl -X POST http://localhost:4000/medecin/ordonnances \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "dateValidite": "2024-12-31",
    "note": "Test ordonnance",
    "medicaments": [
      {
        "medicamentId": 1,
        "posologie": "1 comprimé 3 fois par jour",
        "duree": "7 jours",
        "instructions": "Prendre après les repas"
      }
    ]
  }'
```

## Common Issues

### Issue 1: "Environment variable not found: DATABASE_URL"

**Solution:** Create a `.env` file in your project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4000
```

Replace `username`, `password`, and `database_name` with your actual PostgreSQL credentials.

### Issue 2: "Table 'Ordonnance' does not exist"

**Solution:** You skipped the migration step. Run:

```bash
npx prisma migrate dev --name add_ordonnances_medicaments
```

### Issue 3: "Relation not found" errors in Prisma

**Solution:** Make sure ALL related models have their relations defined:
- `Medecin` must have `ordonnances Ordonnance[]`
- `Patient` must have `ordonnances Ordonnance[]`
- `RendezVous` must have `ordonnances Ordonnance[]`

Then regenerate:
```bash
npx prisma generate
npx prisma migrate dev
```

### Issue 4: Migration fails with foreign key errors

**Solution:** The order matters. Make sure:
1. `Medecin`, `Patient`, and `RendezVous` tables exist first
2. Then create `Medicament` table
3. Then create `Ordonnance` table
4. Finally create `OrdonnanceMedicament` junction table

If needed, reset your database (⚠️ **WARNING: This deletes all data**):

```bash
npx prisma migrate reset
```

## Verification Steps

After completing all steps, verify:

1. **Prisma Client is generated:**
   ```bash
   ls node_modules/@prisma/client
   ```
   Should show the generated client files.

2. **Tables exist in database:**
   ```bash
   npx prisma studio
   ```
   Open Prisma Studio and check that `Medicament`, `Ordonnance`, and `OrdonnanceMedicament` tables are visible.

3. **Server starts without errors:**
   ```bash
   npm start
   ```
   Should see "Server running on port 4000" without Prisma errors.

4. **Endpoints work:**
   Test with curl or Postman - the ordonnance creation should return 201 instead of 500.

## Need More Help?

If you're still getting errors:

1. Check `prisma/migrations/` directory - does the latest migration include these tables?
2. Check your database directly - do the tables exist?
3. Share the full error message and the result of `npx prisma db pull` (shows current database schema)

## Related Documentation

- [API_ORDONNANCES_PRISMA.md](./API_ORDONNANCES_PRISMA.md) - Complete API documentation
- [AUTOCOMPLETE_MEDICAMENTS_GUIDE.md](./AUTOCOMPLETE_MEDICAMENTS_GUIDE.md) - Autocomplete implementation
