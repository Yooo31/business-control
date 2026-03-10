-- CreateEnum
CREATE TYPE "ScanBatchStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScanJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'NEEDS_REVIEW', 'NOT_FOUND');

-- CreateEnum
CREATE TYPE "PlatformName" AS ENUM ('GOOGLE', 'APPLE', 'YELP');

-- CreateEnum
CREATE TYPE "PlatformListingStatus" AS ENUM ('NOT_LINKED', 'OK', 'ERROR', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ListingField" AS ENUM ('NAME', 'ADDRESS', 'PHONE', 'EMAIL', 'WEBSITE', 'HOURS');

-- CreateEnum
CREATE TYPE "MismatchSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "ScanBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "ScanBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanJob" (
    "id" TEXT NOT NULL,
    "scanBatchId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "PlatformName" NOT NULL,
    "status" "ScanJobStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discoveryCandidates" JSONB,
    "platformListingId" TEXT,

    CONSTRAINT "ScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformListing" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "PlatformName" NOT NULL,
    "url" TEXT,
    "externalId" TEXT,
    "isUserVerified" BOOLEAN NOT NULL DEFAULT false,
    "discoveryConfidence" INTEGER,
    "status" "PlatformListingStatus" NOT NULL DEFAULT 'NOT_LINKED',
    "complianceScore" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformListingSnapshot" (
    "id" TEXT NOT NULL,
    "platformListingId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "hours" JSONB,
    "rawData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformListingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingMismatch" (
    "id" TEXT NOT NULL,
    "platformListingId" TEXT NOT NULL,
    "field" "ListingField" NOT NULL,
    "expectedValue" TEXT,
    "actualValue" TEXT,
    "severity" "MismatchSeverity" NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingMismatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanBatch_organizationId_createdAt_idx" ON "ScanBatch"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanJob_status_createdAt_idx" ON "ScanJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ScanJob_businessId_platform_idx" ON "ScanJob"("businessId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "ScanJob_scanBatchId_businessId_platform_key" ON "ScanJob"("scanBatchId", "businessId", "platform");

-- CreateIndex
CREATE INDEX "PlatformListing_businessId_status_idx" ON "PlatformListing"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformListing_businessId_platform_key" ON "PlatformListing"("businessId", "platform");

-- CreateIndex
CREATE INDEX "PlatformListingSnapshot_platformListingId_fetchedAt_idx" ON "PlatformListingSnapshot"("platformListingId", "fetchedAt");

-- CreateIndex
CREATE INDEX "ListingMismatch_platformListingId_detectedAt_idx" ON "ListingMismatch"("platformListingId", "detectedAt");

-- AddForeignKey
ALTER TABLE "ScanBatch" ADD CONSTRAINT "ScanBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_platformListingId_fkey" FOREIGN KEY ("platformListingId") REFERENCES "PlatformListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_scanBatchId_fkey" FOREIGN KEY ("scanBatchId") REFERENCES "ScanBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformListing" ADD CONSTRAINT "PlatformListing_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformListingSnapshot" ADD CONSTRAINT "PlatformListingSnapshot_platformListingId_fkey" FOREIGN KEY ("platformListingId") REFERENCES "PlatformListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMismatch" ADD CONSTRAINT "ListingMismatch_platformListingId_fkey" FOREIGN KEY ("platformListingId") REFERENCES "PlatformListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
