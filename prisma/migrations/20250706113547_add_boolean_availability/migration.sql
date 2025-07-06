/*
  Warnings:

  - You are about to drop the column `bio` on the `Profile` table. All the data in the column will be lost.
  - The `availability` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "bio",
DROP COLUMN "availability",
ADD COLUMN     "availability" BOOLEAN NOT NULL DEFAULT true;
