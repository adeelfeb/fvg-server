-- DropIndex
DROP INDEX "public"."User_phoneNumber_key";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "verificationExpiry" TIMESTAMP(3);
