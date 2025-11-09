-- CreateEnum
CREATE TYPE "RendezVousState" AS ENUM ('Scheduled', 'Waiting', 'InProgress', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "RendezVous" ADD COLUMN     "arrivalTime" TIMESTAMP(3),
ADD COLUMN     "state" "RendezVousState" NOT NULL DEFAULT 'Scheduled';
