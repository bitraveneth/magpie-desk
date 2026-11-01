ALTER TABLE "Invoice" ALTER COLUMN "contractId" DROP NOT NULL;
ALTER TABLE "Invoice" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'WEB';
ALTER TABLE "Invoice" ADD COLUMN "clientName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "clientCompany" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invoice" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

UPDATE "Invoice" AS invoice
SET
  "clientName" = requirement."clientName",
  "clientCompany" = requirement."clientCompany",
  "title" = requirement."title"
FROM "Contract" AS contract
JOIN "Quotation" AS quotation ON quotation."id" = contract."quotationId"
JOIN "Requirement" AS requirement ON requirement."id" = quotation."requirementId"
WHERE invoice."contractId" = contract."id";
