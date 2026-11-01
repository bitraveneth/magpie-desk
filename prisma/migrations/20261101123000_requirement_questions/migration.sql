-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('SENT', 'FILLED', 'SIGNED');

-- CreateEnum
CREATE TYPE "AnswerKind" AS ENUM ('SHORT', 'LONG', 'DROPDOWN', 'MULTI', 'URL', 'URLS', 'DATE', 'FILE');

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "briefStatus" "BriefStatus" NOT NULL DEFAULT 'SENT';

-- CreateTable
CREATE TABLE "RequirementQuestion" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sectionLabel" TEXT NOT NULL,
    "sectionSort" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "help" TEXT NOT NULL DEFAULT '',
    "kind" "AnswerKind" NOT NULL,
    "options" TEXT[],
    "types" TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "dependsOn" TEXT NOT NULL DEFAULT '',
    "dependsValue" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RequirementQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementAnswer" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "RequirementAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementFile" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementAnswer_requirementId_questionId_key" ON "RequirementAnswer"("requirementId", "questionId");

-- CreateIndex
CREATE INDEX "RequirementFile_requirementId_idx" ON "RequirementFile"("requirementId");

-- AddForeignKey
ALTER TABLE "RequirementAnswer" ADD CONSTRAINT "RequirementAnswer_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementAnswer" ADD CONSTRAINT "RequirementAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RequirementQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementFile" ADD CONSTRAINT "RequirementFile_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementFile" ADD CONSTRAINT "RequirementFile_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RequirementQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
