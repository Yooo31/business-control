import {
  buildBusinessScanInput,
  buildSourceOfTruthListing,
} from "@/features/scanner/business";
import { compareListings } from "@/features/scanner/comparison";
import {
  AUTO_LINK_THRESHOLD,
  fromPrismaPlatformName,
  getPlatformListingStatusFromJobOutcome,
  toPrismaListingField,
  toPrismaMismatchSeverity,
} from "@/features/scanner/constants";
import { getPlatformScanner } from "@/features/scanner/platform-scanners";
import { computeComplianceScore } from "@/features/scanner/scoring";
import {
  type Company,
  PlatformListingStatus,
  Prisma,
  ScanBatchStatus,
  type ScanJob,
  ScanJobStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Logger = Pick<typeof console, "error" | "info">;

type QueuedScanJob = ScanJob & {
  business: Company;
};

const globalForScannerWorker = globalThis as unknown as {
  scannerDrainPromise: Promise<{ processedJobs: number }> | undefined;
};

function summarizeJobStatus(statuses: ScanJobStatus[]) {
  if (statuses.some((status) => status === ScanJobStatus.RUNNING)) {
    return ScanBatchStatus.RUNNING;
  }

  if (statuses.some((status) => status === ScanJobStatus.QUEUED)) {
    return ScanBatchStatus.QUEUED;
  }

  if (statuses.some((status) => status === ScanJobStatus.FAILED)) {
    return ScanBatchStatus.FAILED;
  }

  return ScanBatchStatus.COMPLETED;
}

async function refreshScanBatchStatus(scanBatchId: string) {
  const jobs = await prisma.scanJob.findMany({
    where: {
      scanBatchId,
    },
    select: {
      status: true,
    },
  });
  const nextStatus = summarizeJobStatus(jobs.map((job) => job.status));

  await prisma.scanBatch.update({
    where: {
      id: scanBatchId,
    },
    data: {
      status: nextStatus,
      completedAt:
        nextStatus === ScanBatchStatus.COMPLETED ||
        nextStatus === ScanBatchStatus.FAILED
          ? new Date()
          : null,
    },
  });
}

async function persistNotFoundResult(job: QueuedScanJob) {
  const existingListing = await prisma.platformListing.findUnique({
    where: {
      businessId_platform: {
        businessId: job.businessId,
        platform: job.platform,
      },
    },
    select: { url: true, isUserVerified: true },
  });

  if (existingListing?.url) {
    await prisma.platformListing.update({
      where: {
        businessId_platform: {
          businessId: job.businessId,
          platform: job.platform,
        },
      },
      data: {
        status: PlatformListingStatus.NEEDS_REVIEW,
        lastScannedAt: new Date(),
      },
    });

    await prisma.scanJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: ScanJobStatus.NEEDS_REVIEW,
        completedAt: new Date(),
      },
    });
    return;
  }

  const listing = await prisma.platformListing.upsert({
    where: {
      businessId_platform: {
        businessId: job.businessId,
        platform: job.platform,
      },
    },
    update: {
      status: PlatformListingStatus.NOT_LINKED,
      url: null,
      externalId: null,
      discoveryConfidence: 0,
      complianceScore: 0,
      lastScannedAt: new Date(),
    },
    create: {
      businessId: job.businessId,
      platform: job.platform,
      status: PlatformListingStatus.NOT_LINKED,
      url: null,
      externalId: null,
      discoveryConfidence: 0,
      complianceScore: 0,
      lastScannedAt: new Date(),
    },
  });

  await prisma.scanJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: ScanJobStatus.NOT_FOUND,
      completedAt: new Date(),
      platformListingId: listing.id,
    },
  });
}

async function persistNeedsReviewResult(
  job: QueuedScanJob,
  candidate: {
    url: string;
    confidenceScore: number;
    rawData: Record<string, unknown>;
  },
) {
  const externalId =
    typeof candidate.rawData.externalId === "string"
      ? candidate.rawData.externalId
      : null;
  const listing = await prisma.platformListing.upsert({
    where: {
      businessId_platform: {
        businessId: job.businessId,
        platform: job.platform,
      },
    },
    update: {
      status: PlatformListingStatus.NEEDS_REVIEW,
      url: candidate.url,
      externalId,
      discoveryConfidence: Math.round(candidate.confidenceScore),
      complianceScore: 0,
      lastScannedAt: new Date(),
    },
    create: {
      businessId: job.businessId,
      platform: job.platform,
      status: PlatformListingStatus.NEEDS_REVIEW,
      url: candidate.url,
      externalId,
      discoveryConfidence: Math.round(candidate.confidenceScore),
      complianceScore: 0,
      lastScannedAt: new Date(),
    },
  });

  await prisma.scanJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: ScanJobStatus.NEEDS_REVIEW,
      completedAt: new Date(),
      platformListingId: listing.id,
    },
  });
}

async function persistSuccessfulResult(
  job: QueuedScanJob,
  candidate: {
    url: string;
    confidenceScore: number;
    rawData: Record<string, unknown>;
  },
) {
  const scanner = getPlatformScanner(fromPrismaPlatformName(job.platform));
  const rawListing = await scanner.fetch(candidate.url);
  const normalizedListing = scanner.normalize(rawListing);
  const mismatches = compareListings(
    buildSourceOfTruthListing(job.business),
    normalizedListing,
  );
  const complianceScore = computeComplianceScore(mismatches);
  const externalId =
    typeof candidate.rawData.externalId === "string"
      ? candidate.rawData.externalId
      : rawListing.externalId;

  await prisma.$transaction(async (tx) => {
    const listing = await tx.platformListing.upsert({
      where: {
        businessId_platform: {
          businessId: job.businessId,
          platform: job.platform,
        },
      },
      update: {
        status: getPlatformListingStatusFromJobOutcome(
          ScanJobStatus.SUCCESS,
          mismatches.length,
        ),
        url: candidate.url,
        externalId,
        discoveryConfidence: Math.round(candidate.confidenceScore),
        complianceScore,
        lastScannedAt: new Date(),
      },
      create: {
        businessId: job.businessId,
        platform: job.platform,
        status: getPlatformListingStatusFromJobOutcome(
          ScanJobStatus.SUCCESS,
          mismatches.length,
        ),
        url: candidate.url,
        externalId,
        discoveryConfidence: Math.round(candidate.confidenceScore),
        complianceScore,
        lastScannedAt: new Date(),
      },
    });

    await tx.platformListingSnapshot.create({
      data: {
        platformListingId: listing.id,
        name: normalizedListing.name,
        address: normalizedListing.address,
        phone: normalizedListing.phone,
        email: normalizedListing.email,
        website: normalizedListing.website,
        hours:
          normalizedListing.hours === null
            ? Prisma.JsonNull
            : (normalizedListing.hours as Prisma.InputJsonValue),
        rawData: rawListing.payload as Prisma.InputJsonValue,
      },
    });

    await tx.listingMismatch.deleteMany({
      where: {
        platformListingId: listing.id,
      },
    });

    if (mismatches.length > 0) {
      await tx.listingMismatch.createMany({
        data: mismatches.map((mismatch) => ({
          platformListingId: listing.id,
          field: toPrismaListingField(mismatch.field),
          expectedValue: mismatch.expectedValue,
          actualValue: mismatch.actualValue,
          severity: toPrismaMismatchSeverity(mismatch.severity),
          detectedAt: new Date(),
        })),
      });
    }

    await tx.scanJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: ScanJobStatus.SUCCESS,
        completedAt: new Date(),
        platformListingId: listing.id,
      },
    });
  });
}

async function executeQueuedScanJob(job: QueuedScanJob) {
  const scanner = getPlatformScanner(fromPrismaPlatformName(job.platform));
  const business = buildBusinessScanInput(job.business);

  const existingListing = await prisma.platformListing.findUnique({
    where: {
      businessId_platform: {
        businessId: job.businessId,
        platform: job.platform,
      },
    },
    select: {
      url: true,
      isUserVerified: true,
    },
  });

  if (existingListing?.url) {
    await persistSuccessfulResult(job, {
      url: existingListing.url,
      confidenceScore: existingListing.isUserVerified ? 100 : 80,
      rawData: {},
    });
    return;
  }

  const candidates = await scanner.discover(business);

  await prisma.scanJob.update({
    where: {
      id: job.id,
    },
    data: {
      discoveryCandidates: candidates as Prisma.InputJsonValue,
    },
  });

  const bestCandidate = candidates[0];

  if (!bestCandidate) {
    await persistNotFoundResult(job);
    return;
  }

  if (bestCandidate.confidenceScore < AUTO_LINK_THRESHOLD) {
    await persistNeedsReviewResult(job, bestCandidate);
    return;
  }

  await persistSuccessfulResult(job, bestCandidate);
}

async function markBatchAsRunning(scanBatchId: string) {
  await prisma.scanBatch.update({
    where: {
      id: scanBatchId,
    },
    data: {
      status: ScanBatchStatus.RUNNING,
      startedAt: new Date(),
    },
  });
}

export async function processQueuedScanJobs(input?: {
  limit?: number;
  logger?: Logger;
}) {
  const limit = input?.limit ?? 3;
  const logger = input?.logger ?? console;
  let processedJobs = 0;
  const jobs = await prisma.scanJob.findMany({
    where: {
      status: ScanJobStatus.QUEUED,
    },
    include: {
      business: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  for (const job of jobs) {
    const claim = await prisma.scanJob.updateMany({
      where: {
        id: job.id,
        status: ScanJobStatus.QUEUED,
      },
      data: {
        status: ScanJobStatus.RUNNING,
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    if (claim.count === 0) {
      continue;
    }

    processedJobs += claim.count;
    await markBatchAsRunning(job.scanBatchId);

    try {
      await executeQueuedScanJob(job);
      logger.info(
        `Processed scan job ${job.id} for ${fromPrismaPlatformName(job.platform)}.`,
      );
    } catch (error) {
      logger.error(error);

      await prisma.scanJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: ScanJobStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : "Unknown scanner error.",
          completedAt: new Date(),
        },
      });

      const existingListing = await prisma.platformListing.findUnique({
        where: {
          businessId_platform: {
            businessId: job.businessId,
            platform: job.platform,
          },
        },
        select: { url: true, isUserVerified: true },
      });

      await prisma.platformListing.upsert({
        where: {
          businessId_platform: {
            businessId: job.businessId,
            platform: job.platform,
          },
        },
        update: {
          status: PlatformListingStatus.NEEDS_REVIEW,
          lastScannedAt: new Date(),
        },
        create: {
          businessId: job.businessId,
          platform: job.platform,
          status: PlatformListingStatus.NEEDS_REVIEW,
          url: existingListing?.url ?? null,
          isUserVerified: existingListing?.isUserVerified ?? false,
          lastScannedAt: new Date(),
        },
      });
    } finally {
      await refreshScanBatchStatus(job.scanBatchId);
    }
  }

  return {
    processedJobs,
  };
}

export async function drainQueuedScanJobs(input?: {
  limit?: number;
  logger?: Logger;
}) {
  const logger = input?.logger ?? console;
  let totalProcessedJobs = 0;

  for (;;) {
    const result = await processQueuedScanJobs(input);

    totalProcessedJobs += result.processedJobs;

    if (result.processedJobs === 0) {
      break;
    }
  }

  logger.info(`Scanner drain completed with ${String(totalProcessedJobs)} jobs.`);

  return {
    processedJobs: totalProcessedJobs,
  };
}

export function triggerQueuedScanJobs(input?: { limit?: number; logger?: Logger }) {
  globalForScannerWorker.scannerDrainPromise ??= drainQueuedScanJobs(input).finally(
    () => {
      globalForScannerWorker.scannerDrainPromise = undefined;
    },
  );

  return globalForScannerWorker.scannerDrainPromise;
}
