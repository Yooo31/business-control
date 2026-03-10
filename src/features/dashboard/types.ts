export type DashboardPlatformKey = "google" | "apple" | "yelp";

export type DashboardPlatformStatus =
  | "not_linked"
  | "ok"
  | "error"
  | "needs_review"
  | "scanning";

export type DashboardScanState =
  | "never_scanned"
  | "scanning"
  | "completed"
  | "failed";

export type DashboardPlatformSummary = {
  id: string | null;
  key: DashboardPlatformKey;
  label: string;
  lastScannedAt: Date | null;
  score: number | null;
  status: DashboardPlatformStatus;
  url: string | null;
};

export type DashboardBusinessSummary = {
  address: string;
  email: string;
  id: string;
  lastScanAt: Date | null;
  name: string;
  phone: string;
  platforms: DashboardPlatformSummary[];
  scanState: DashboardScanState;
  score: number;
};

export type DashboardBusinessDetail = DashboardBusinessSummary & {
  activity: string | null;
  latestBatchId: string | null;
  latestScanLabel: string;
  mismatchesByPlatform: {
    count: number;
    mismatches: {
      actualValue: string | null;
      expectedValue: string | null;
      field: string;
      id: string;
      severity: string;
    }[];
    platformKey: DashboardPlatformKey;
    platformLabel: string;
    score: number | null;
    status: DashboardPlatformStatus;
    url: string | null;
  }[];
  reference: {
    address: string;
    email: string;
    name: string;
    phone: string;
    website: string;
  };
  scanHistory: {
    completedAt: Date | null;
    createdAt: Date;
    id: string;
    mismatchesCount: number;
    platformCount: number;
    startedAt: Date | null;
    status: string;
  }[];
  website: string;
};
