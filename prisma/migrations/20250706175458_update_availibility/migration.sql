-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'CONTRACTOR', 'ADMIN');

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
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "roleType" TEXT[],
    "verticalSpecialization" TEXT[],
    "rateRange" TEXT,
    "englishProficiency" TEXT,
    "availability" TEXT,
    "otherRoleType" TEXT,
    "otherVertical" TEXT,
    "yearsExperience" INTEGER,
    "skills" TEXT[],
    "remoteTools" TEXT[],
    "spokenLanguages" TEXT[],
    "otherLanguage" TEXT,
    "customRate" DOUBLE PRECISION,
    "resumeUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "internetSpeedScreenshotUrl" TEXT,
    "timezone" TEXT,
    "country" TEXT,
    "otherCountry" TEXT,
    "videoIntroductionUrl" TEXT,
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
