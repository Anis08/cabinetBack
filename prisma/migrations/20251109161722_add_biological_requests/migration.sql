-- CreateEnum
CREATE TYPE "BiologicalRequestStatus" AS ENUM ('EnCours', 'Completed');

-- CreateTable
CREATE TABLE "BiologicalRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "sampleTypes" TEXT[],
    "requestedExams" TEXT[],
    "results" JSONB,
    "status" "BiologicalRequestStatus" NOT NULL DEFAULT 'EnCours',
    "samplingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiologicalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BiologicalRequest_requestNumber_key" ON "BiologicalRequest"("requestNumber");

-- AddForeignKey
ALTER TABLE "BiologicalRequest" ADD CONSTRAINT "BiologicalRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiologicalRequest" ADD CONSTRAINT "BiologicalRequest_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
