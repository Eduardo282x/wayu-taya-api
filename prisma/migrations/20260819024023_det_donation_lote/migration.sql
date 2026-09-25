-- AlterTable
ALTER TABLE "DetDonation" ADD COLUMN "lote" TEXT NOT NULL DEFAULT '';

-- Backfill DetDonation.lote from Donation.lote (header lote)
UPDATE "DetDonation" d
SET "lote" = COALESCE(don."lote", '')
FROM "Donation" don
WHERE don."id" = d."donationId";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN "lote" TEXT NOT NULL DEFAULT '';

-- Backfill Inventory.lote from Donation.lote (header lote)
UPDATE "Inventory" i
SET "lote" = COALESCE(don."lote", '')
FROM "Donation" don
WHERE don."id" = i."donationId";

-- AlterTable
ALTER TABLE "HistoryInventory" ADD COLUMN "lote" TEXT NOT NULL DEFAULT '';

-- Backfill HistoryInventory.lote from Donation.lote (header lote)
UPDATE "HistoryInventory" h
SET "lote" = COALESCE(don."lote", '')
FROM "Donation" don
WHERE don."id" = h."donationId";
