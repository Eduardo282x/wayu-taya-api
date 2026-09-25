-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "controlNumber" TEXT NOT NULL DEFAULT '';

-- Backfill controlNumber with D-<id> for existing donations
UPDATE "Donation" SET "controlNumber" = 'D-' || "id";