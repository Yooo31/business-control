import type {
  ListingField,
  MismatchSeverity,
  PlatformName,
} from "@/features/scanner/types";
import {
  ListingField as PrismaListingField,
  MismatchSeverity as PrismaMismatchSeverity,
  PlatformListingStatus as PrismaPlatformListingStatus,
  PlatformName as PrismaPlatformName,
  ScanJobStatus as PrismaScanJobStatus,
} from "@/generated/prisma/client";

export const PLATFORM_NAMES: PlatformName[] = ["google", "apple", "yelp"];

export const AUTO_LINK_THRESHOLD = 85;
export const REVIEW_THRESHOLD = 60;
export const COMPARABLE_FIELDS_COUNT = 6;

export const FIELD_SEVERITY: Record<ListingField, MismatchSeverity> = {
  name: "medium",
  address: "high",
  phone: "high",
  email: "low",
  website: "medium",
  hours: "low",
};

export function toPrismaPlatformName(
  platform: PlatformName,
): PrismaPlatformName {
  switch (platform) {
    case "google":
      return PrismaPlatformName.GOOGLE;
    case "apple":
      return PrismaPlatformName.APPLE;
    case "yelp":
      return PrismaPlatformName.YELP;
  }
}

export function fromPrismaPlatformName(
  platform: PrismaPlatformName,
): PlatformName {
  switch (platform) {
    case PrismaPlatformName.GOOGLE:
      return "google";
    case PrismaPlatformName.APPLE:
      return "apple";
    case PrismaPlatformName.YELP:
      return "yelp";
  }
}

export function toPrismaListingField(field: ListingField): PrismaListingField {
  switch (field) {
    case "name":
      return PrismaListingField.NAME;
    case "address":
      return PrismaListingField.ADDRESS;
    case "phone":
      return PrismaListingField.PHONE;
    case "email":
      return PrismaListingField.EMAIL;
    case "website":
      return PrismaListingField.WEBSITE;
    case "hours":
      return PrismaListingField.HOURS;
  }
}

export function toPrismaMismatchSeverity(
  severity: MismatchSeverity,
): PrismaMismatchSeverity {
  switch (severity) {
    case "low":
      return PrismaMismatchSeverity.LOW;
    case "medium":
      return PrismaMismatchSeverity.MEDIUM;
    case "high":
      return PrismaMismatchSeverity.HIGH;
  }
}

export function getPlatformListingStatusFromJobOutcome(
  status: PrismaScanJobStatus,
  mismatchCount: number,
): PrismaPlatformListingStatus {
  switch (status) {
    case PrismaScanJobStatus.NOT_FOUND:
      return PrismaPlatformListingStatus.NOT_LINKED;
    case PrismaScanJobStatus.NEEDS_REVIEW:
      return PrismaPlatformListingStatus.NEEDS_REVIEW;
    case PrismaScanJobStatus.FAILED:
      return PrismaPlatformListingStatus.ERROR;
    case PrismaScanJobStatus.SUCCESS:
      return mismatchCount === 0
        ? PrismaPlatformListingStatus.OK
        : PrismaPlatformListingStatus.ERROR;
    case PrismaScanJobStatus.QUEUED:
    case PrismaScanJobStatus.RUNNING:
      return PrismaPlatformListingStatus.NOT_LINKED;
  }
}
