-- AlterTable
ALTER TABLE "RendezVous" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);

CREATE UNIQUE INDEX one_inprogress_rendezvous
ON "RendezVous" ((state))
WHERE state = 'InProgress';