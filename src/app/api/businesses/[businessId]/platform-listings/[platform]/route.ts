import { after, NextResponse } from "next/server";
import { z } from "zod";

import { validatePlatformListingUrl } from "@/features/dashboard/listing-url";
import { createScanForBusinessPlatforms } from "@/features/scanner/orchestration";
import { triggerQueuedScanJobs } from "@/features/scanner/worker";
import { PlatformListingStatus, PlatformName } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const listingPayloadSchema = z.object({
  url: z.string().trim().min(1),
});

type RouteContext = {
  params: Promise<{
    businessId: string;
    platform: string;
  }>;
};

function parsePlatformName(platform: string) {
  switch (platform.toLowerCase()) {
    case "google":
      return PlatformName.GOOGLE;
    case "apple":
      return PlatformName.APPLE;
    case "yelp":
      return PlatformName.YELP;
    default:
      return null;
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { businessId, platform } = await context.params;
  const platformName = parsePlatformName(platform);

  if (!platformName) {
    return NextResponse.json(
      { message: "Unsupported platform." },
      { status: 404 },
    );
  }

  const body: unknown = await request.json();
  const parsedBody = listingPayloadSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Invalid listing payload.",
        issues: z.treeifyError(parsedBody.error),
      },
      { status: 422 },
    );
  }

  const business = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!business) {
    return NextResponse.json(
      { message: "Business not found." },
      { status: 404 },
    );
  }

  const validation = validatePlatformListingUrl(
    platformName,
    parsedBody.data.url,
  );

  if (!validation.isValid || !validation.normalizedUrl) {
    return NextResponse.json(
      { message: validation.message ?? "Invalid listing URL." },
      { status: 422 },
    );
  }

  await prisma.listingMismatch.deleteMany({
    where: {
      platformListing: {
        businessId,
        platform: platformName,
      },
    },
  });

  await prisma.platformListingSnapshot.deleteMany({
    where: {
      platformListing: {
        businessId,
        platform: platformName,
      },
    },
  });

  const listing = await prisma.platformListing.upsert({
    where: {
      businessId_platform: {
        businessId,
        platform: platformName,
      },
    },
    update: {
      url: validation.normalizedUrl,
      externalId: null,
      status: PlatformListingStatus.LINKED,
      isUserVerified: true,
      complianceScore: 0,
      discoveryConfidence: 100,
      lastScannedAt: null,
    },
    create: {
      businessId,
      platform: platformName,
      url: validation.normalizedUrl,
      externalId: null,
      status: PlatformListingStatus.LINKED,
      isUserVerified: true,
      complianceScore: 0,
      discoveryConfidence: 100,
      lastScannedAt: null,
    },
    select: {
      id: true,
      url: true,
      platform: true,
      status: true,
    },
  });

  const scan = await createScanForBusinessPlatforms({
    organizationId: session.user.id,
    businessPlatforms: [
      {
        businessId,
        platform: platformName,
        platformListingId: listing.id,
      },
    ],
  });

  after(() => triggerQueuedScanJobs());

  return NextResponse.json({
    listing,
    scanBatchId: scan.scanBatchId,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { businessId, platform } = await context.params;
  const platformName = parsePlatformName(platform);

  if (!platformName) {
    return NextResponse.json(
      { message: "Unsupported platform." },
      { status: 404 },
    );
  }

  const business = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!business) {
    return NextResponse.json(
      { message: "Business not found." },
      { status: 404 },
    );
  }

  await prisma.platformListing.deleteMany({
    where: {
      businessId,
      platform: platformName,
    },
  });

  return NextResponse.json({ ok: true });
}
