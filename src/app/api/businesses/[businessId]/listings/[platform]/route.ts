import { after, type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fromPrismaPlatformName, toPrismaPlatformName } from "@/features/scanner/constants";
import { triggerQueuedScanJobs } from "@/features/scanner/worker";
import {
  PlatformListingStatus,
  ScanBatchStatus,
  ScanJobStatus,
} from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    businessId: string;
    platform: string;
  }>;
};

const platformSchema = z.enum(["google", "apple", "yelp"]);

const linkListingSchema = z.object({
  url: z.string().trim().min(1, "L'URL est requise."),
});

const PLATFORM_URL_PATTERNS: Record<string, RegExp[]> = {
  google: [
    /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i,
    /^https?:\/\/maps\.google\.[a-z.]+/i,
  ],
  apple: [
    /^https?:\/\/maps\.apple\.com/i,
  ],
  yelp: [
    /^https?:\/\/(www\.)?yelp\.[a-z.]+\/biz\//i,
  ],
};

function validateListingUrl(url: string, platform: string): { valid: true } | { valid: false; message: string } {
  try {
    new URL(url);
  } catch {
    return { valid: false, message: "L'URL n'est pas valide." };
  }

  const patterns = PLATFORM_URL_PATTERNS[platform];
  if (!patterns) {
    return { valid: false, message: "Plateforme non supportée." };
  }

  const isValid = patterns.some((pattern) => pattern.test(url));
  if (!isValid) {
    const platformLabels: Record<string, string> = {
      google: "Google Maps",
      apple: "Apple Maps",
      yelp: "Yelp",
    };
    return {
      valid: false,
      message: `L'URL doit être une fiche ${platformLabels[platform]}.`,
    };
  }

  return { valid: true };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { businessId, platform: platformParam } = await context.params;

  const platformResult = platformSchema.safeParse(platformParam);
  if (!platformResult.success) {
    return NextResponse.json(
      { message: "Plateforme non supportée." },
      { status: 400 },
    );
  }

  const platform = platformResult.data;
  const prismaPlatform = toPrismaPlatformName(platform);

  const business = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json(
      { message: "Entreprise non trouvée." },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parseResult = linkListingSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { message: parseResult.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { url } = parseResult.data;

  const urlValidation = validateListingUrl(url, platform);
  if (!urlValidation.valid) {
    return NextResponse.json(
      { message: urlValidation.message },
      { status: 422 },
    );
  }

  const listing = await prisma.platformListing.upsert({
    where: {
      businessId_platform: {
        businessId,
        platform: prismaPlatform,
      },
    },
    update: {
      url,
      status: PlatformListingStatus.NEEDS_REVIEW,
      isUserVerified: true,
      lastScannedAt: null,
    },
    create: {
      businessId,
      platform: prismaPlatform,
      url,
      status: PlatformListingStatus.NEEDS_REVIEW,
      isUserVerified: true,
      discoveryConfidence: 100,
      complianceScore: 0,
    },
  });

  const scanBatch = await prisma.scanBatch.create({
    data: {
      organizationId: session.user.id,
      status: ScanBatchStatus.QUEUED,
    },
  });

  await prisma.scanJob.create({
    data: {
      scanBatchId: scanBatch.id,
      businessId,
      platform: prismaPlatform,
      status: ScanJobStatus.QUEUED,
    },
  });

  after(() => {
    void triggerQueuedScanJobs();
  });

  return NextResponse.json({
    listing: {
      id: listing.id,
      platform: fromPrismaPlatformName(prismaPlatform),
      url: listing.url,
      status: listing.status.toLowerCase(),
      isUserVerified: listing.isUserVerified,
    },
    scanBatchId: scanBatch.id,
    message: "Fiche liée avec succès. Un scan a été lancé.",
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { businessId, platform: platformParam } = await context.params;

  const platformResult = platformSchema.safeParse(platformParam);
  if (!platformResult.success) {
    return NextResponse.json(
      { message: "Plateforme non supportée." },
      { status: 400 },
    );
  }

  const prismaPlatform = toPrismaPlatformName(platformResult.data);

  const business = await prisma.company.findFirst({
    where: {
      id: businessId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json(
      { message: "Entreprise non trouvée." },
      { status: 404 },
    );
  }

  await prisma.platformListing.deleteMany({
    where: {
      businessId,
      platform: prismaPlatform,
    },
  });

  return NextResponse.json({
    message: "Fiche supprimée.",
  });
}
