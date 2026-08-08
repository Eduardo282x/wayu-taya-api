/*
  Warnings:

  - You are about to drop the column `amount` on the `Medicine` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Medicine` table. All the data in the column will be lost.
  - Added the required column `phone` to the `Providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsible` to the `Providers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN "amount",
DROP COLUMN "unit",
ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "Providers" ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "responsible" TEXT NOT NULL;
