/*
  Warnings:

  - You are about to drop the column `dateJour` on the `RendezVous` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patientId,medecinId,date]` on the table `RendezVous` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RendezVous_patientId_medecinId_dateJour_key";

-- AlterTable
ALTER TABLE "RendezVous" DROP COLUMN "dateJour";

-- CreateIndex
CREATE UNIQUE INDEX "RendezVous_patientId_medecinId_date_key" ON "RendezVous"("patientId", "medecinId", "date");
