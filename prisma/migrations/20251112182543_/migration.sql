-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('top', 'bottom');

-- CreateEnum
CREATE TYPE "DemandeMedicamentStatus" AS ENUM ('EnAttente', 'Acceptee', 'Rejetee');

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_medecinId_fkey";

-- AlterTable
ALTER TABLE "Medecin" ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ALTER COLUMN "poids" DROP NOT NULL,
ALTER COLUMN "taille" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" SERIAL NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AdType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "position" "AdPosition" NOT NULL DEFAULT 'top',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplementaryExam" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplementaryExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFile" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicament" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "dosage" TEXT,
    "forme" TEXT,
    "fabricant" TEXT,
    "moleculeMereId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "frequence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medecinId" INTEGER,

    CONSTRAINT "Medicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dosage" (
    "id" SERIAL NOT NULL,
    "valeur" TEXT NOT NULL,
    "medicamentId" INTEGER NOT NULL,

    CONSTRAINT "Dosage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moleculeMere" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "moleculeMere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ordonnance" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "rendezVousId" INTEGER,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "Ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdonnanceMedicament" (
    "id" SERIAL NOT NULL,
    "ordonnanceId" INTEGER NOT NULL,
    "medicamentId" INTEGER NOT NULL,
    "posologie" TEXT NOT NULL,
    "duree" TEXT,
    "instructions" TEXT,

    CONSTRAINT "OrdonnanceMedicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeMedicament" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "DemandeMedicament_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicament_nom_key" ON "Medicament"("nom");

-- CreateIndex
CREATE INDEX "Medicament_nom_idx" ON "Medicament"("nom");

-- CreateIndex
CREATE INDEX "Medicament_moleculeMereId_idx" ON "Medicament"("moleculeMereId");

-- CreateIndex
CREATE INDEX "Medicament_type_idx" ON "Medicament"("type");

-- CreateIndex
CREATE UNIQUE INDEX "moleculeMere_nom_key" ON "moleculeMere"("nom");

-- CreateIndex
CREATE INDEX "Ordonnance_patientId_idx" ON "Ordonnance"("patientId");

-- CreateIndex
CREATE INDEX "Ordonnance_medecinId_idx" ON "Ordonnance"("medecinId");

-- CreateIndex
CREATE INDEX "Ordonnance_dateCreation_idx" ON "Ordonnance"("dateCreation");

-- CreateIndex
CREATE UNIQUE INDEX "OrdonnanceMedicament_ordonnanceId_medicamentId_key" ON "OrdonnanceMedicament"("ordonnanceId", "medicamentId");

-- CreateIndex
CREATE INDEX "DemandeMedicament_medecinId_idx" ON "DemandeMedicament"("medecinId");

-- CreateIndex
CREATE INDEX "DemandeMedicament_status_idx" ON "DemandeMedicament"("status");

-- CreateIndex
CREATE INDEX "DemandeMedicament_createdAt_idx" ON "DemandeMedicament"("createdAt");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplementaryExam" ADD CONSTRAINT "ComplementaryExam_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFile" ADD CONSTRAINT "ExamFile_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ComplementaryExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicament" ADD CONSTRAINT "Medicament_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicament" ADD CONSTRAINT "Medicament_moleculeMereId_fkey" FOREIGN KEY ("moleculeMereId") REFERENCES "moleculeMere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dosage" ADD CONSTRAINT "Dosage_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "RendezVous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdonnanceMedicament" ADD CONSTRAINT "OrdonnanceMedicament_ordonnanceId_fkey" FOREIGN KEY ("ordonnanceId") REFERENCES "Ordonnance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdonnanceMedicament" ADD CONSTRAINT "OrdonnanceMedicament_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeMedicament" ADD CONSTRAINT "DemandeMedicament_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeMedicament" ADD CONSTRAINT "DemandeMedicament_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
