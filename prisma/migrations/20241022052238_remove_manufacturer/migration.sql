/*
  Warnings:

  - You are about to drop the column `manufacturerId` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the `Manufacturer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `manufacturer` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_manufacturerId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "manufacturerId",
ADD COLUMN     "manufacturer" TEXT NOT NULL;

-- DropTable
DROP TABLE "Manufacturer";
