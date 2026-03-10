import { NextResponse } from "next/server";

import { serializeScanJobPlatform } from "@/features/scanner/orchestration";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    scanBatchId: string;
  }>;
};

function toLowerCaseStatus(status: string) {
  return status.toLowerCase();
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { scanBatchId } = await context.params;
  const scanBatch = await prisma.scanBatch.findFirst({
    where: {
      id: scanBatchId,
      organizationId: session.user.id,
    },
    include: {
      jobs: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
          platformListing: {
            select: {
              id: true,
              status: true,
              complianceScore: true,
              url: true,
            },
          },
        },
        orderBy: [
          {
            businessId: "asc",
          },
          {
            platform: "asc",
          },
        ],
      },
    },
  });

  if (!scanBatch) {
    return NextResponse.json(
      { message: "Scan batch not found." },
      { status: 404 },
    );
  }

  const completedStatuses = new Set([
    "SUCCESS",
    "FAILED",
    "NEEDS_REVIEW",
    "NOT_FOUND",
  ]);
  const completedJobs = scanBatch.jobs.filter((job) =>
    completedStatuses.has(job.status),
  );
  const byBusiness = Object.values(
    scanBatch.jobs.reduce<
      Record<
        string,
        { businessId: string; businessName: string; jobs: unknown[] }
      >
    >((accumulator, job) => {
      const current = accumulator[job.businessId] ?? {
        businessId: job.businessId,
        businessName: job.business.name,
        jobs: [],
      };

      current.jobs.push({
        id: job.id,
        platform: serializeScanJobPlatform(job.platform),
        status: toLowerCaseStatus(job.status),
        listing: job.platformListing
          ? {
              id: job.platformListing.id,
              status: toLowerCaseStatus(job.platformListing.status),
              complianceScore: job.platformListing.complianceScore,
              url: job.platformListing.url,
            }
          : null,
      });

      accumulator[job.businessId] = current;

      return accumulator;
    }, {}),
  );

  return NextResponse.json({
    id: scanBatch.id,
    status: toLowerCaseStatus(scanBatch.status),
    createdAt: scanBatch.createdAt,
    startedAt: scanBatch.startedAt,
    completedAt: scanBatch.completedAt,
    totalJobs: scanBatch.jobs.length,
    completedJobs: completedJobs.length,
    businesses: byBusiness,
  });
}
