import type {
  DashboardPlatformKey,
  DashboardPlatformStatus,
  DashboardScanState,
} from "@/features/dashboard/types";
import {
  PlatformListingStatus,
  PlatformName,
  type ScanBatchStatus,
  type ScanJobStatus,
} from "@/generated/prisma/client";

export function platformKeyFromPrisma(platform: PlatformName): DashboardPlatformKey {
  switch (platform) {
    case PlatformName.GOOGLE:
      return "google";
    case PlatformName.APPLE:
      return "apple";
    case PlatformName.YELP:
      return "yelp";
  }
}

export function mapPlatformStatus(input: {
  listingStatus: PlatformListingStatus | null;
  latestJobStatus: ScanJobStatus | null;
}): DashboardPlatformStatus {
  if (
    input.latestJobStatus === "QUEUED" ||
    input.latestJobStatus === "RUNNING"
  ) {
    return "scanning";
  }

  switch (input.listingStatus) {
    case PlatformListingStatus.OK:
      return "ok";
    case PlatformListingStatus.ERROR:
      return "error";
    case PlatformListingStatus.NEEDS_REVIEW:
      return "needs_review";
    case PlatformListingStatus.NOT_LINKED:
    case null:
      return "not_linked";
  }
}

export function mapScanState(input: {
  latestBatchStatus: ScanBatchStatus | null;
  latestJobStatus: ScanJobStatus | null;
}): DashboardScanState {
  if (!input.latestBatchStatus && !input.latestJobStatus) {
    return "never_scanned";
  }

  if (
    input.latestBatchStatus === "QUEUED" ||
    input.latestBatchStatus === "RUNNING" ||
    input.latestJobStatus === "QUEUED" ||
    input.latestJobStatus === "RUNNING"
  ) {
    return "scanning";
  }

  if (
    input.latestBatchStatus === "FAILED" ||
    input.latestJobStatus === "FAILED"
  ) {
    return "failed";
  }

  return "completed";
}
