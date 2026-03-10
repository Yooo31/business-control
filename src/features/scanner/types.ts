export const platformNames = ["google", "apple", "yelp"] as const;

export type PlatformName = (typeof platformNames)[number];

export type NormalizedHours = Record<string, string[]>;

export type NormalizedListing = {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: NormalizedHours | null;
};

export type RawListingData = {
  platform: PlatformName;
  url: string;
  externalId: string | null;
  payload: Record<string, unknown>;
};

export type DiscoveryCandidate = {
  url: string;
  title: string;
  address: string | null;
  phone: string | null;
  confidenceScore: number;
  rawData: Record<string, unknown>;
};

export type BusinessScanInput = {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours?: NormalizedHours | null;
};

export type PlatformScanner = {
  platform: PlatformName;
  discover(business: BusinessScanInput): Promise<DiscoveryCandidate[]>;
  fetch(url: string): Promise<RawListingData>;
  normalize(raw: RawListingData): NormalizedListing;
};

export type ListingField =
  | "name"
  | "address"
  | "phone"
  | "email"
  | "website"
  | "hours";

export type MismatchSeverity = "low" | "medium" | "high";

export type ListingMismatchInput = {
  field: ListingField;
  expectedValue: string | null;
  actualValue: string | null;
  severity: MismatchSeverity;
};
