-- DropForeignKey
ALTER TABLE "RendezVous" DROP CONSTRAINT "RendezVous_patientId_fkey";

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
