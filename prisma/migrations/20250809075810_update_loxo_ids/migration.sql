/*
  Warnings:

  - A unique constraint covering the columns `[loxoId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[loxoId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[loxoId]` on the table `PersonEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[loxoId]` on the table `PersonType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[loxoId]` on the table `Phone` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE email_id_seq;
ALTER TABLE "Email" ADD COLUMN     "loxoId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('email_id_seq');
ALTER SEQUENCE email_id_seq OWNED BY "Email"."id";

-- AlterTable
CREATE SEQUENCE person_id_seq;
ALTER TABLE "Person" ADD COLUMN     "loxoId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('person_id_seq');
ALTER SEQUENCE person_id_seq OWNED BY "Person"."id";

-- AlterTable
CREATE SEQUENCE personevent_id_seq;
ALTER TABLE "PersonEvent" ADD COLUMN     "loxoId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('personevent_id_seq');
ALTER SEQUENCE personevent_id_seq OWNED BY "PersonEvent"."id";

-- AlterTable
CREATE SEQUENCE persontype_id_seq;
ALTER TABLE "PersonType" ADD COLUMN     "loxoId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('persontype_id_seq');
ALTER SEQUENCE persontype_id_seq OWNED BY "PersonType"."id";

-- AlterTable
CREATE SEQUENCE phone_id_seq;
ALTER TABLE "Phone" ADD COLUMN     "loxoId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('phone_id_seq');
ALTER SEQUENCE phone_id_seq OWNED BY "Phone"."id";

-- CreateIndex
CREATE UNIQUE INDEX "Email_loxoId_key" ON "Email"("loxoId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_loxoId_key" ON "Person"("loxoId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEvent_loxoId_key" ON "PersonEvent"("loxoId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonType_loxoId_key" ON "PersonType"("loxoId");

-- CreateIndex
CREATE UNIQUE INDEX "Phone_loxoId_key" ON "Phone"("loxoId");
