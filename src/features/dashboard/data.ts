import { notFound } from "next/navigation";

import {
  mapPlatformStatus,
  mapScanState,
  platformKeyFromPrisma,
} from "@/features/dashboard/prisma-status";
import type {
  DashboardBusinessDetail,
  DashboardBusinessSummary,
  DashboardPlatformSummary,
} from "@/features/dashboard/types";
import type {
  PlatformListingStatus,
  PlatformName,
  ScanJobStatus,
} from "@/generated/prisma/client";
import { PlatformName as PrismaPlatformName } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DashboardPlatformListingRecord = {
  complianceScore: number;
  id: string;
  lastScannedAt: Date | null;
  platform: PlatformName;
  status: PlatformListingStatus;
  url: string | null;
};

type DashboardRecentJobRecord = {
  platform: PlatformName;
  status: ScanJobStatus;
};

function formatAddress(input: {
  addressLine: string;
  city: string | null;
  postalCode: string | null;
}) {
  return [input.addressLine, input.postalCode, input.city]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function formatScanTimestamp(value: Date | null) {
  if (!value) {
    return "Aucune date disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatEnumValue(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

async function requireSessionUserId() {
  const session = await auth();

  if (!session?.user.id) {
    notFound();
  }

  return session.user.id;
}

function buildPlatformSummaries(input: {
  platformListings: DashboardPlatformListingRecord[];
  recentJobs: DashboardRecentJobRecord[];
}) {
  const latestJobByPlatform = new Map(
    input.recentJobs.map((job) => [job.platform, job.status]),
  );
  const listingByPlatform = new Map(
    input.platformListings.map((listing) => [listing.platform, listing]),
  );

  return [PrismaPlatformName.GOOGLE, PrismaPlatformName.APPLE, PrismaPlatformName.YELP].map(
    (platform) => {
    const platformKey = platformKeyFromPrisma(platform);
    const listing = listingByPlatform.get(platform) ?? null;
    const status = mapPlatformStatus({
      listingStatus: listing?.status ?? null,
      latestJobStatus: latestJobByPlatform.get(platform) ?? null,
    });

    return {
      id: listing?.id ?? null,
      key: platformKey,
      label:
        platformKey === "google"
          ? "Google"
          : platformKey === "apple"
            ? "Apple"
            : "Yelp",
      lastScannedAt: listing?.lastScannedAt ?? null,
      score: listing?.complianceScore ?? null,
      status,
      url: listing?.url ?? null,
    } satisfies DashboardPlatformSummary;
    },
  );
}

function computeGlobalScore(platforms: DashboardPlatformSummary[]) {
  const scoredPlatforms = platforms.filter(
    (platform) => typeof platform.score === "number",
  );

  if (scoredPlatforms.length === 0) {
    return 0;
  }

  const total = scoredPlatforms.reduce(
    (sum, platform) => sum + (platform.score ?? 0),
    0,
  );

  return Math.round(total / scoredPlatforms.length);
}

export async function getDashboardBusinesses() {
  const userId = await requireSessionUserId();
  const companies = await prisma.company.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      addressLine: true,
      postalCode: true,
      city: true,
      email: true,
      phone: true,
      platformListings: {
        orderBy: {
          platform: "asc",
        },
        select: {
          id: true,
          platform: true,
          status: true,
          complianceScore: true,
          lastScannedAt: true,
          url: true,
        },
      },
      scanJobs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          platform: true,
          status: true,
          scanBatch: {
            select: {
              status: true,
              startedAt: true,
              completedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return companies.map((company) => {
    const platforms = buildPlatformSummaries({
      platformListings: company.platformListings,
      recentJobs: company.scanJobs.map((job) => ({
        platform: job.platform,
        status: job.status,
      })),
    });
    const latestJob = company.scanJobs[0] ?? null;

    return {
      address: formatAddress(company),
      email: company.email,
      id: company.id,
      lastScanAt:
        latestJob?.scanBatch.completedAt ??
        latestJob?.scanBatch.startedAt ??
        latestJob?.scanBatch.createdAt ??
        null,
      name: company.name,
      phone: company.phone,
      platforms,
      scanState: mapScanState({
        latestBatchStatus: latestJob?.scanBatch.status ?? null,
        latestJobStatus: latestJob?.status ?? null,
      }),
      score: computeGlobalScore(platforms),
    } satisfies DashboardBusinessSummary;
  });
}

export async function getDashboardBusinessDetail(businessId: string) {
  const userId = await requireSessionUserId();
  const company = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId,
    },
    select: {
      id: true,
      name: true,
      addressLine: true,
      postalCode: true,
      city: true,
      email: true,
      phone: true,
      website: true,
      activity: true,
      platformListings: {
        orderBy: {
          platform: "asc",
        },
        select: {
          id: true,
          platform: true,
          status: true,
          complianceScore: true,
          lastScannedAt: true,
          url: true,
          mismatches: {
            orderBy: [
              {
                severity: "desc",
              },
              {
                field: "asc",
              },
            ],
            select: {
              id: true,
              field: true,
              expectedValue: true,
              actualValue: true,
              severity: true,
            },
          },
        },
      },
      scanJobs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
        select: {
          id: true,
          platform: true,
          status: true,
          createdAt: true,
          completedAt: true,
          startedAt: true,
          platformListing: {
            select: {
              mismatches: {
                select: {
                  id: true,
                },
              },
            },
          },
          scanBatch: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              startedAt: true,
              completedAt: true,
              jobs: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  const platforms = buildPlatformSummaries({
    platformListings: company.platformListings,
    recentJobs: company.scanJobs.map((job) => ({
      platform: job.platform,
      status: job.status,
    })),
  });
  const latestJob = company.scanJobs[0] ?? null;
  const scanHistory = Array.from(
    new Map(
      company.scanJobs.map((job) => [
        job.scanBatch.id,
        {
          completedAt: job.scanBatch.completedAt,
          createdAt: job.scanBatch.createdAt,
          id: job.scanBatch.id,
          mismatchesCount: 0,
          platformCount: job.scanBatch.jobs.length,
          startedAt: job.scanBatch.startedAt,
          status: formatEnumValue(job.scanBatch.status),
        },
      ]),
    ).values(),
  ).slice(0, 8);
  const mismatchesByPlatform = company.platformListings.map((listing) => {
    const platformKey = platformKeyFromPrisma(listing.platform);
    const latestJobForPlatform =
      company.scanJobs.find((job) => job.platform === listing.platform) ?? null;
    const status = mapPlatformStatus({
      listingStatus: listing.status,
      latestJobStatus: latestJobForPlatform?.status ?? null,
    });

    return {
      count: listing.mismatches.length,
      platformKey,
      platformLabel:
        platformKey === "google"
          ? "Google"
          : platformKey === "apple"
            ? "Apple"
            : "Yelp",
      score: listing.complianceScore,
      status,
      url: listing.url,
      mismatches: listing.mismatches.map((mismatch) => ({
        actualValue: mismatch.actualValue,
        expectedValue: mismatch.expectedValue,
        field: formatEnumValue(mismatch.field),
        id: mismatch.id,
        severity: formatEnumValue(mismatch.severity),
      })),
    };
  });

  return {
    activity: company.activity,
    address: formatAddress(company),
    email: company.email,
    id: company.id,
    lastScanAt:
      latestJob?.scanBatch.completedAt ??
      latestJob?.scanBatch.startedAt ??
      latestJob?.scanBatch.createdAt ??
      null,
    latestBatchId: latestJob?.scanBatch.id ?? null,
    latestScanLabel: latestJob?.scanBatch.createdAt
      ? formatScanTimestamp(
          latestJob.scanBatch.completedAt ??
            latestJob.scanBatch.startedAt ??
            latestJob.scanBatch.createdAt,
        )
      : "Jamais scanne",
    mismatchesByPlatform,
    name: company.name,
    phone: company.phone,
    platforms,
    reference: {
      address: formatAddress(company),
      email: company.email,
      name: company.name,
      phone: company.phone,
      website: company.website,
    },
    scanHistory,
    scanState: mapScanState({
      latestBatchStatus: latestJob?.scanBatch.status ?? null,
      latestJobStatus: latestJob?.status ?? null,
    }),
    score: computeGlobalScore(platforms),
    website: company.website,
  } satisfies DashboardBusinessDetail;
}
