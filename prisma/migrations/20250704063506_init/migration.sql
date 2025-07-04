/*
  Warnings:

  - The `roleType` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `verticalSpecialization` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `englishProficiency` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rateRange` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `availability` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "roleType",
ADD COLUMN     "roleType" TEXT[],
DROP COLUMN "verticalSpecialization",
ADD COLUMN     "verticalSpecialization" TEXT[],
DROP COLUMN "englishProficiency",
ADD COLUMN     "englishProficiency" TEXT,
DROP COLUMN "rateRange",
ADD COLUMN     "rateRange" TEXT,
DROP COLUMN "availability",
ADD COLUMN     "availability" TEXT;

-- DropEnum
DROP TYPE "Availability";

-- DropEnum
DROP TYPE "EnglishProficiency";

-- DropEnum
DROP TYPE "RateRange";

-- DropEnum
DROP TYPE "RoleType";

-- DropEnum
DROP TYPE "VerticalSpecialization";
