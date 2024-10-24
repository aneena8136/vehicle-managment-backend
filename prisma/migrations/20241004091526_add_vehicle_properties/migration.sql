/*
  Warnings:

  - You are about to drop the column `description` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `fuelType` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gearType` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manufacturer` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seats` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'EV');

-- CreateEnum
CREATE TYPE "GearType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "description",
ADD COLUMN     "fuelType" "FuelType" NOT NULL,
ADD COLUMN     "gearType" "GearType" NOT NULL,
ADD COLUMN     "manufacturer" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "seats" INTEGER NOT NULL;
