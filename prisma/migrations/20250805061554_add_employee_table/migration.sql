-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL,
    "position" INTEGER,
    "workflow_stage_id" INTEGER,
    "candidate_rejection_reason" TEXT,
    "jobId" INTEGER,
    "jobTitle" TEXT,
    "jobPublishedName" TEXT,
    "personId" INTEGER NOT NULL,
    "latestPersonEventId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "profile_picture_thumb_url" TEXT,
    "profile_picture_original_url" TEXT,
    "location" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "current_title" TEXT,
    "current_company" TEXT,
    "current_compensation" TEXT,
    "compensation" TEXT,
    "compensation_notes" TEXT,
    "compensation_currency_id" INTEGER,
    "salary" TEXT,
    "salary_type_id" INTEGER,
    "owned_by_id" INTEGER,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "linkedin_url" TEXT,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "email_type_id" INTEGER,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phone" (
    "id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "phone_type_id" INTEGER,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "Phone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonType" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "PersonType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonEvent" (
    "id" INTEGER NOT NULL,
    "activity_type_id" INTEGER,
    "created_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_at" TIMESTAMP(3),
    "updated_by_id" INTEGER,

    CONSTRAINT "PersonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_personId_key" ON "Employee"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_latestPersonEventId_key" ON "Employee"("latestPersonEventId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_latestPersonEventId_fkey" FOREIGN KEY ("latestPersonEventId") REFERENCES "PersonEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phone" ADD CONSTRAINT "Phone_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonType" ADD CONSTRAINT "PersonType_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
