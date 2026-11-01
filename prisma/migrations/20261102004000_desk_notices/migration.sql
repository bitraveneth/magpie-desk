ALTER TABLE "Requirement" ADD COLUMN "correctionNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Requirement" ADD COLUMN "confirmedAt" TIMESTAMP(3);

CREATE TABLE "DeskNotice" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "DeskNotice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeskNotice_readAt_idx" ON "DeskNotice"("readAt");

ALTER TABLE "DeskNotice" ADD CONSTRAINT "DeskNotice_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
