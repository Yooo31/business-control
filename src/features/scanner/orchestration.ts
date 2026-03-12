import {
  PLATFORM_NAMES,
  toPrismaPlatformName,
} from "@/features/scanner/constants";
import {
  PlatformName as PrismaPlatformName,
  type Prisma,
  ScanBatchStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type PrismaTransaction = Prisma.TransactionClient;

export async function createScanBatch(
  organizationId: string,
  tx: PrismaTransaction = prisma,
) {
  return tx.scanBatch.create({
    data: {
      organizationId,
      status: ScanBatchStatus.QUEUED,
    },
  });
}

export async function enqueueScanJobs(
  scanBatchId: string,
  businessIds: string[],
  tx: PrismaTransaction = prisma,
) {
  const jobs = await Promise.all(
    businessIds.flatMap((businessId) =>
      PLATFORM_NAMES.map((platform) =>
        tx.scanJob.create({
          data: {
            scanBatchId,
            businessId,
            platform: toPrismaPlatformName(platform),
          },
          select: {
            id: true,
            businessId: true,
            platform: true,
            status: true,
          },
        }),
      ),
    ),
  );

  return jobs;
}

export async function enqueueScanJobsForPlatforms(
  scanBatchId: string,
  businessPlatformPairs: Array<{
    businessId: string;
    platform: PrismaPlatformName;
    platformListingId?: string;
  }>,
  tx: PrismaTransaction = prisma,
) {
  const jobs = await Promise.all(
    businessPlatformPairs.map((pair) =>
      tx.scanJob.create({
        data: {
          scanBatchId,
          businessId: pair.businessId,
          platform: pair.platform,
          ...(pair.platformListingId
            ? { platformListingId: pair.platformListingId }
            : {}),
        },
        select: {
          id: true,
          businessId: true,
          platform: true,
          status: true,
        },
      }),
    ),
  );

  return jobs;
}

export async function createScanForBusinesses(input: {
  organizationId: string;
  businessIds: string[];
}) {
  const uniqueBusinessIds = Array.from(new Set(input.businessIds));

  if (uniqueBusinessIds.length === 0) {
    throw new Error("At least one businessId is required to create a scan.");
  }

  const ownedBusinesses = await prisma.company.findMany({
    where: {
      userId: input.organizationId,
      id: {
        in: uniqueBusinessIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (ownedBusinesses.length !== uniqueBusinessIds.length) {
    throw new Error(
      "One or more businesses do not belong to this organization.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const scanBatch = await createScanBatch(input.organizationId, tx);
    const jobs = await enqueueScanJobs(scanBatch.id, uniqueBusinessIds, tx);

    return {
      scanBatchId: scanBatch.id,
      businessIds: uniqueBusinessIds,
      jobs,
    };
  });
}

export async function createScanForBusinessPlatforms(input: {
  organizationId: string;
  businessPlatforms: Array<{
    businessId: string;
    platform: PrismaPlatformName;
    platformListingId?: string;
  }>;
}) {
  const uniqueBusinessPlatforms = Array.from(
    new Map(
      input.businessPlatforms.map((entry) => [
        `${entry.businessId}:${entry.platform}`,
        entry,
      ]),
    ).values(),
  );

  if (uniqueBusinessPlatforms.length === 0) {
    throw new Error(
      "At least one business/platform pair is required to create a scan.",
    );
  }

  const ownedBusinesses = await prisma.company.findMany({
    where: {
      userId: input.organizationId,
      id: {
        in: uniqueBusinessPlatforms.map((entry) => entry.businessId),
      },
    },
    select: {
      id: true,
    },
  });

  const ownedBusinessIds = new Set(
    ownedBusinesses.map((business) => business.id),
  );

  if (
    uniqueBusinessPlatforms.some(
      (entry) => !ownedBusinessIds.has(entry.businessId),
    )
  ) {
    throw new Error(
      "One or more businesses do not belong to this organization.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const scanBatch = await createScanBatch(input.organizationId, tx);
    const jobs = await enqueueScanJobsForPlatforms(
      scanBatch.id,
      uniqueBusinessPlatforms,
      tx,
    );

    return {
      scanBatchId: scanBatch.id,
      businessIds: Array.from(
        new Set(uniqueBusinessPlatforms.map((entry) => entry.businessId)),
      ),
      jobs,
    };
  });
}

export async function createScanForAllBusinesses(organizationId: string) {
  const businesses = await prisma.company.findMany({
    where: {
      userId: organizationId,
    },
    select: {
      id: true,
    },
  });

  return createScanForBusinesses({
    organizationId,
    businessIds: businesses.map((business) => business.id),
  });
}

export function serializeScanJobPlatform(platform: PrismaPlatformName) {
  switch (platform) {
    case PrismaPlatformName.GOOGLE:
      return "google";
    case PrismaPlatformName.APPLE:
      return "apple";
    case PrismaPlatformName.YELP:
      return "yelp";
  }
}

export function listSupportedPlatforms() {
  return [...PLATFORM_NAMES];
}
