-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "benefited" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "DetDonation" ADD COLUMN     "benefited" INTEGER NOT NULL DEFAULT 1;

-- Backfill DetDonation.benefited from Medicine.benefited (before dropping the column)
UPDATE "DetDonation" d
SET "benefited" = COALESCE(m."benefited", 1)
FROM "Medicine" m
WHERE m."id" = d."medicineId";

-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN "benefited",
ADD COLUMN     "presentation" TEXT NOT NULL DEFAULT '';
