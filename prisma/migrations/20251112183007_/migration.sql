/*
  Warnings:

  - You are about to drop the column `dosage` on the `Medicament` table. All the data in the column will be lost.
  - You are about to drop the column `fabricant` on the `Medicament` table. All the data in the column will be lost.
  - You are about to drop the column `forme` on the `Medicament` table. All the data in the column will be lost.
  - You are about to drop the column `frequence` on the `Medicament` table. All the data in the column will be lost.
  - You are about to drop the column `medecinId` on the `Medicament` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Medicament" DROP CONSTRAINT "Medicament_medecinId_fkey";

-- AlterTable
ALTER TABLE "Medicament" DROP COLUMN "dosage",
DROP COLUMN "fabricant",
DROP COLUMN "forme",
DROP COLUMN "frequence",
DROP COLUMN "medecinId";
