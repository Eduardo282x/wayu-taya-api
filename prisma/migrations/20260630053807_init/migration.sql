/*
  Warnings:

  - You are about to drop the column `peopleId` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Events` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rolId` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Documents" ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "peopleId",
ADD COLUMN     "institutionId" INTEGER;

-- AlterTable
ALTER TABLE "Events" DROP COLUMN "date",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "benefited" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "countryOfOrigin" TEXT NOT NULL DEFAULT 'VE';

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "rolId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Institutions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rif" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "parishId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Institutions" ADD CONSTRAINT "Institutions_parishId_fkey" FOREIGN KEY ("parishId") REFERENCES "Parish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
