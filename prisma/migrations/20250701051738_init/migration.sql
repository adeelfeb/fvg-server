-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'CONTRACTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN_ASSISTANT', 'EXECUTIVE_ASSISTANT', 'REMOTE_PROFESSIONAL', 'DATA_ENTRY', 'GRAPHIC_DESIGNER', 'UI_UX_DESIGNER', 'VIDEO_EDITOR', 'SOCIAL_MEDIA_MANAGER', 'SOFTWARE_DEVELOPER', 'IT_SUPPORT', 'QA_TESTER', 'ACCOUNTANT_CPA', 'BOOKKEEPER', 'PAYROLL_ADMIN', 'PARALEGAL', 'LAWYER_LLB_JD', 'LEGAL_ADMIN', 'ARCHITECTURAL_DRAFTER', 'CAD_TECHNICIAN', 'REVIT_SPECIALIST', 'MEDICAL_REMOTE_PROFESSIONAL', 'CLAIMS_PROCESSOR', 'EMR_ADMIN', 'SALES_ADMIN', 'LEAD_GEN_SPECIALIST', 'APPOINTMENT_SETTER', 'DIGITAL_MARKETER', 'SEO_SPECIALIST', 'ADS_MANAGER', 'CSR', 'TECH_SUPPORT', 'LIVE_CHAT_AGENT', 'OTHER_ROLE');

-- CreateEnum
CREATE TYPE "VerticalSpecialization" AS ENUM ('RESIDENTIAL_ARCHITECTURE', 'LIGHT_COMMERCIAL', 'INSURANCE', 'REAL_ESTATE', 'E_COMMERCE', 'LEGAL_SERVICES', 'ACCOUNTING', 'HEALTHCARE', 'MARKETING_AGENCY', 'TECH_SAAS', 'EDUCATION', 'OTHER_VERTICAL');

-- CreateEnum
CREATE TYPE "EnglishProficiency" AS ENUM ('A1_BEGINNER', 'A2_ELEMENTARY', 'B1_INTERMEDIATE', 'B2_UPPER_INTERMEDIATE', 'C1_ADVANCED', 'C2_PROFICIENT');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "RateRange" AS ENUM ('VOLUNTEER', 'ONE_TO_FOUR', 'FIVE_TO_SIX', 'SEVEN_TO_EIGHT', 'NINE_TO_TEN', 'ELEVEN_TO_FOURTEEN', 'FIFTEEN_TO_NINETEEN', 'TWENTY_TO_THIRTY', 'THIRTY_PLUS', 'NEGOTIABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleType" "RoleType",
    "otherRoleType" TEXT,
    "verticalSpecialization" "VerticalSpecialization",
    "otherVertical" TEXT,
    "yearsExperience" INTEGER,
    "skills" TEXT[],
    "remoteTools" TEXT[],
    "spokenLanguages" TEXT[],
    "otherLanguage" TEXT,
    "englishProficiency" "EnglishProficiency",
    "rateRange" "RateRange",
    "customRate" DOUBLE PRECISION,
    "resumeUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "internetSpeedScreenshotUrl" TEXT,
    "availability" "Availability",
    "timezone" TEXT,
    "country" TEXT,
    "otherCountry" TEXT,
    "videoIntroductionUrl" TEXT,
    "bio" TEXT,
    "portfolioUrl" TEXT,
    "hipaaCertified" BOOLEAN NOT NULL DEFAULT false,
    "professionalCertValid" BOOLEAN NOT NULL DEFAULT false,
    "signedNda" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "criminalRecordCheck" BOOLEAN NOT NULL DEFAULT false,
    "gdprTraining" BOOLEAN NOT NULL DEFAULT false,
    "pciCompliance" BOOLEAN NOT NULL DEFAULT false,
    "socialMediaScreening" BOOLEAN NOT NULL DEFAULT false,
    "usInsuranceCompliance" BOOLEAN NOT NULL DEFAULT false,
    "canadaInsuranceCompliance" BOOLEAN NOT NULL DEFAULT false,
    "willingToSignNda" BOOLEAN NOT NULL DEFAULT false,
    "willingBackgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "willingReferenceCheck" BOOLEAN NOT NULL DEFAULT false,
    "privacyPolicyConsent" BOOLEAN NOT NULL DEFAULT false,
    "creditCheck" BOOLEAN NOT NULL DEFAULT false,
    "vulnerableSectorCheck" BOOLEAN NOT NULL DEFAULT false,
    "contactConsent" BOOLEAN NOT NULL DEFAULT false,
    "emailConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContractor" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "endedAt" TIMESTAMP(3),
    "paymentIntentId" TEXT,
    "paymentAmount" DOUBLE PRECISION,
    "paymentStatus" TEXT DEFAULT 'pending',

    CONSTRAINT "ClientContractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikedContractor" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikedContractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "clientContractorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "calendlyEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MeetingToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MeetingToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "ClientContractor_contractorId_idx" ON "ClientContractor"("contractorId");

-- CreateIndex
CREATE INDEX "ClientContractor_clientId_idx" ON "ClientContractor"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientContractor_clientId_contractorId_key" ON "ClientContractor"("clientId", "contractorId");

-- CreateIndex
CREATE INDEX "LikedContractor_clientId_idx" ON "LikedContractor"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LikedContractor_clientId_contractorId_key" ON "LikedContractor"("clientId", "contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "_MeetingToUser_B_index" ON "_MeetingToUser"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContractor" ADD CONSTRAINT "ClientContractor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContractor" ADD CONSTRAINT "ClientContractor_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedContractor" ADD CONSTRAINT "LikedContractor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikedContractor" ADD CONSTRAINT "LikedContractor_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_clientContractorId_fkey" FOREIGN KEY ("clientContractorId") REFERENCES "ClientContractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingToUser" ADD CONSTRAINT "_MeetingToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingToUser" ADD CONSTRAINT "_MeetingToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
