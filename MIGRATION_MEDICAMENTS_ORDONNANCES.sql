-- Migration SQL pour ajouter les tables Médicaments, Ordonnances et Demandes
-- Exécutez ce SQL dans votre base de données PostgreSQL OU utilisez: npx prisma migrate dev

-- 1. Table Medicament
CREATE TABLE IF NOT EXISTS "Medicament" (
    "id" SERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "forme" TEXT NOT NULL,
    "fabricant" TEXT NOT NULL,
    "moleculeMere" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frequence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medecinId" INTEGER,
    CONSTRAINT "Medicament_medecinId_fkey" 
        FOREIGN KEY ("medecinId") 
        REFERENCES "Medecin"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT "Medicament_nom_dosage_forme_key" 
        UNIQUE ("nom", "dosage", "forme")
);

CREATE INDEX IF NOT EXISTS "Medicament_nom_idx" ON "Medicament"("nom");
CREATE INDEX IF NOT EXISTS "Medicament_moleculeMere_idx" ON "Medicament"("moleculeMere");
CREATE INDEX IF NOT EXISTS "Medicament_type_idx" ON "Medicament"("type");

-- 2. Table Ordonnance
CREATE TABLE IF NOT EXISTS "Ordonnance" (
    "id" SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "rendezVousId" INTEGER,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3),
    "note" TEXT,
    CONSTRAINT "Ordonnance_patientId_fkey" 
        FOREIGN KEY ("patientId") 
        REFERENCES "Patient"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT "Ordonnance_medecinId_fkey" 
        FOREIGN KEY ("medecinId") 
        REFERENCES "Medecin"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT "Ordonnance_rendezVousId_fkey" 
        FOREIGN KEY ("rendezVousId") 
        REFERENCES "RendezVous"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Ordonnance_patientId_idx" ON "Ordonnance"("patientId");
CREATE INDEX IF NOT EXISTS "Ordonnance_medecinId_idx" ON "Ordonnance"("medecinId");
CREATE INDEX IF NOT EXISTS "Ordonnance_dateCreation_idx" ON "Ordonnance"("dateCreation");

-- 3. Table OrdonnanceMedicament (liaison)
CREATE TABLE IF NOT EXISTS "OrdonnanceMedicament" (
    "id" SERIAL PRIMARY KEY,
    "ordonnanceId" INTEGER NOT NULL,
    "medicamentId" INTEGER NOT NULL,
    "posologie" TEXT NOT NULL,
    "duree" TEXT,
    "instructions" TEXT,
    CONSTRAINT "OrdonnanceMedicament_ordonnanceId_fkey" 
        FOREIGN KEY ("ordonnanceId") 
        REFERENCES "Ordonnance"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT "OrdonnanceMedicament_medicamentId_fkey" 
        FOREIGN KEY ("medicamentId") 
        REFERENCES "Medicament"("id") 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT "OrdonnanceMedicament_ordonnanceId_medicamentId_key" 
        UNIQUE ("ordonnanceId", "medicamentId")
);

-- 4. Enum DemandeMedicamentStatus
CREATE TYPE "DemandeMedicamentStatus" AS ENUM ('EnAttente', 'Acceptee', 'Rejetee');

-- 5. Table DemandeMedicament
CREATE TABLE IF NOT EXISTS "DemandeMedicament" (
    "id" SERIAL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "forme" TEXT NOT NULL,
    "fabricant" TEXT NOT NULL,
    "moleculeMere" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "frequence" TEXT,
    "medecinId" INTEGER NOT NULL,
    "status" "DemandeMedicamentStatus" NOT NULL DEFAULT 'EnAttente',
    "motifRejet" TEXT,
    "medicamentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "traitePar" INTEGER,
    "dateTraitement" TIMESTAMP(3),
    CONSTRAINT "DemandeMedicament_medecinId_fkey" 
        FOREIGN KEY ("medecinId") 
        REFERENCES "Medecin"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT "DemandeMedicament_medicamentId_fkey" 
        FOREIGN KEY ("medicamentId") 
        REFERENCES "Medicament"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DemandeMedicament_medecinId_idx" ON "DemandeMedicament"("medecinId");
CREATE INDEX IF NOT EXISTS "DemandeMedicament_status_idx" ON "DemandeMedicament"("status");
CREATE INDEX IF NOT EXISTS "DemandeMedicament_createdAt_idx" ON "DemandeMedicament"("createdAt");

-- 6. Ajouter la colonne price au modèle Medecin (si elle n'existe pas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Medecin' AND column_name='price') THEN
        ALTER TABLE "Medecin" ADD COLUMN "price" INTEGER;
    END IF;
END $$;

-- Vérification finale
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Medicament', 'Ordonnance', 'OrdonnanceMedicament', 'DemandeMedicament');
