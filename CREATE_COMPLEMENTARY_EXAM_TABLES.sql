-- SQL pour créer les tables ComplementaryExam et ExamFile
-- Exécutez ce SQL dans votre base de données PostgreSQL

-- Table ComplementaryExam
CREATE TABLE IF NOT EXISTS "ComplementaryExam" (
    "id" SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComplementaryExam_patientId_fkey" 
        FOREIGN KEY ("patientId") 
        REFERENCES "Patient"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Table ExamFile
CREATE TABLE IF NOT EXISTS "ExamFile" (
    "id" SERIAL PRIMARY KEY,
    "examId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamFile_examId_fkey" 
        FOREIGN KEY ("examId") 
        REFERENCES "ComplementaryExam"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "ComplementaryExam_patientId_idx" ON "ComplementaryExam"("patientId");
CREATE INDEX IF NOT EXISTS "ExamFile_examId_idx" ON "ExamFile"("examId");

-- Vérifier que les tables ont été créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ComplementaryExam', 'ExamFile');
