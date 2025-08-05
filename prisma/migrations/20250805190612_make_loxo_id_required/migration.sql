/*
  Warnings:

  - You are about to drop the column `position` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
CREATE SEQUENCE employee_id_seq;
ALTER TABLE "Employee" DROP COLUMN "position",
ADD COLUMN     "loxoCandidateId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('employee_id_seq');
ALTER SEQUENCE employee_id_seq OWNED BY "Employee"."id";
