import { prisma } from "@/lib/prisma";

import { getBusinessScanState } from "./status-mapping";

export async function getBusinessesForDashboard(userId: string) {
  const businesses = await prisma.company.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      addressLine: true,
      city: true,
      postalCode: true,
      platformListings: {
        select: {
          platform: true,
          status: true,
          complianceScore: true,
          lastScannedAt: true,
        },
      },
      scanJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          scanBatch: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  return businesses.map((business) => {
    // Calculate average compliance score
    const platformScores = business.platformListings.map(
      (p) => p.complianceScore,
    );
    const averageScore =
      platformScores.length > 0
        ? Math.round(
            platformScores.reduce((a, b) => a + b, 0) / platformScores.length,
          )
        : 0;

    // Get the last scan status
    const lastScanBatchStatus = business.scanJobs[0]?.scanBatch.status ?? null;
    const scanState = getBusinessScanState(lastScanBatchStatus);

    // Build platform statuses (default to NOT_LINKED for platforms without listings)
    const platformMap = new Map(
      business.platformListings.map((p) => [p.platform, p.status]),
    );
    const platforms = (["GOOGLE", "APPLE", "YELP"] as const).map(
      (platform) => ({
        platform,
        status: platformMap.get(platform) ?? "NOT_LINKED",
      }),
    );

    // Format address
    const addressParts = [
      business.addressLine,
      business.postalCode,
      business.city,
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : null;

    return {
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address,
      platforms,
      complianceScore: averageScore,
      scanState,
    };
  });
}

export async function getBusinessDetail(businessId: string, userId: string) {
  const business = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId,
    },
    select: {
      id: true,
      name: true,
      legalName: true,
      email: true,
      phone: true,
      website: true,
      addressLine: true,
      city: true,
      postalCode: true,
      siren: true,
      siret: true,
      activity: true,
      platformListings: {
        select: {
          id: true,
          platform: true,
          status: true,
          url: true,
          isUserVerified: true,
          discoveryConfidence: true,
          complianceScore: true,
          lastScannedAt: true,
          mismatches: {
            orderBy: { detectedAt: "desc" },
            select: {
              id: true,
              field: true,
              expectedValue: true,
              actualValue: true,
              severity: true,
              detectedAt: true,
            },
          },
        },
      },
      scanJobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          platform: true,
          status: true,
          createdAt: true,
          completedAt: true,
          scanBatch: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  // Calculate overall compliance score
  const platformScores = business.platformListings.map(
    (p) => p.complianceScore,
  );
  const averageScore =
    platformScores.length > 0
      ? Math.round(
          platformScores.reduce((a, b) => a + b, 0) / platformScores.length,
        )
      : 0;

  // Get the last scan status
  const lastScanBatchStatus = business.scanJobs[0]?.scanBatch.status ?? null;
  const scanState = getBusinessScanState(lastScanBatchStatus);

  // Format address
  const addressParts = [
    business.addressLine,
    business.postalCode,
    business.city,
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  // Build scan history from scan jobs, grouped by batch
  const scanHistory = business.scanJobs.reduce(
    (acc, job) => {
      const existing = acc.find((h) => h.batchId === job.scanBatch.id);
      if (existing) {
        existing.platformsCount += 1;
        if (job.status === "FAILED" || job.status === "NEEDS_REVIEW") {
          existing.errorsCount += 1;
        }
      } else {
        acc.push({
          batchId: job.scanBatch.id,
          status: job.scanBatch.status,
          date: job.createdAt,
          platformsCount: 1,
          errorsCount:
            job.status === "FAILED" || job.status === "NEEDS_REVIEW" ? 1 : 0,
        });
      }
      return acc;
    },
    [] as Array<{
      batchId: string;
      status: string;
      date: Date;
      platformsCount: number;
      errorsCount: number;
    }>,
  );

  return {
    id: business.id,
    name: business.name,
    legalName: business.legalName,
    email: business.email,
    phone: business.phone,
    website: business.website,
    address,
    siren: business.siren,
    siret: business.siret,
    activity: business.activity,
    complianceScore: averageScore,
    scanState,
    platformListings: business.platformListings,
    scanHistory,
  };
}

export type DashboardBusiness = Awaited<
  ReturnType<typeof getBusinessesForDashboard>
>[number];
export type BusinessDetailData = NonNullable<
  Awaited<ReturnType<typeof getBusinessDetail>>
>;
