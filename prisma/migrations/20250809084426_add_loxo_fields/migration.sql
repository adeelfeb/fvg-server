/*
  Warnings:

  - A unique constraint covering the columns `[loxoId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loxoId" INTEGER;

-- CreateTable
CREATE TABLE "LoxoJob" (
    "id" TEXT NOT NULL,
    "loxoCandidateId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobPublishedName" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoxoJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoxoJob_loxoCandidateId_key" ON "LoxoJob"("loxoCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "User_loxoId_key" ON "User"("loxoId");

-- AddForeignKey
ALTER TABLE "LoxoJob" ADD CONSTRAINT "LoxoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
