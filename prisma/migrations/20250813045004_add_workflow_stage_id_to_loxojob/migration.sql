/*
  Warnings:

  - You are about to drop the `Email` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Person` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Phone` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loxoCandidateId,jobId]` on the table `LoxoJob` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_personId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_latestPersonEventId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_personId_fkey";

-- DropForeignKey
ALTER TABLE "PersonType" DROP CONSTRAINT "PersonType_personId_fkey";

-- DropForeignKey
ALTER TABLE "Phone" DROP CONSTRAINT "Phone_personId_fkey";

-- DropIndex
DROP INDEX "LoxoJob_loxoCandidateId_key";

-- AlterTable
ALTER TABLE "LoxoJob" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "workflowStageId" INTEGER;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "compensation" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN,
ADD COLUMN     "loxoCreatedAt" TIMESTAMP(3),
ADD COLUMN     "loxoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "salary" DOUBLE PRECISION,
ADD COLUMN     "salaryTypeId" INTEGER,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "workflowStageId" INTEGER;

-- DropTable
DROP TABLE "Email";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "Person";

-- DropTable
DROP TABLE "PersonEvent";

-- DropTable
DROP TABLE "PersonType";

-- DropTable
DROP TABLE "Phone";

-- CreateIndex
CREATE UNIQUE INDEX "LoxoJob_loxoCandidateId_jobId_key" ON "LoxoJob"("loxoCandidateId", "jobId");
