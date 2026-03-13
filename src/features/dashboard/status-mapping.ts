import type { PlatformListingStatus, ScanBatchStatus, ScanJobStatus } from "@/generated/prisma/client";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export type StatusDisplay = {
  label: string;
  tone: StatusTone;
  colorClass: string;
  bgClass: string;
};

export const platformStatusMap: Record<PlatformListingStatus, StatusDisplay> = {
  NOT_LINKED: {
    label: "Non lié",
    tone: "neutral",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  LINKED: {
    label: "Conforme",
    tone: "success",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/15",
  },
  NEEDS_REVIEW: {
    label: "À revoir",
    tone: "warning",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500/15",
  },
};

export const scanJobStatusMap: Record<ScanJobStatus, StatusDisplay> = {
  QUEUED: {
    label: "En attente",
    tone: "neutral",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  RUNNING: {
    label: "En cours",
    tone: "info",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-500/15",
  },
  SUCCESS: {
    label: "Terminé",
    tone: "success",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/15",
  },
  FAILED: {
    label: "Échoué",
    tone: "danger",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500/15",
  },
  NEEDS_REVIEW: {
    label: "À revoir",
    tone: "warning",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500/15",
  },
  NOT_FOUND: {
    label: "Non trouvé",
    tone: "neutral",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
};

export const scanBatchStatusMap: Record<ScanBatchStatus, StatusDisplay> = {
  QUEUED: {
    label: "En attente",
    tone: "neutral",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  RUNNING: {
    label: "Scan en cours",
    tone: "info",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-500/15",
  },
  COMPLETED: {
    label: "Terminé",
    tone: "success",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/15",
  },
  FAILED: {
    label: "Échoué",
    tone: "danger",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500/15",
  },
};

export type BusinessScanState = "never_scanned" | "scanning" | "completed" | "failed";

export function getBusinessScanState(
  lastScanStatus: ScanBatchStatus | null | undefined,
): BusinessScanState {
  if (!lastScanStatus) {
    return "never_scanned";
  }

  switch (lastScanStatus) {
    case "RUNNING":
    case "QUEUED":
      return "scanning";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    default:
      return "never_scanned";
  }
}

export const businessScanStateMap: Record<BusinessScanState, StatusDisplay> = {
  never_scanned: {
    label: "Jamais scanné",
    tone: "neutral",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
  scanning: {
    label: "Scan en cours",
    tone: "info",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-500/15",
  },
  completed: {
    label: "Dernier scan OK",
    tone: "success",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/15",
  },
  failed: {
    label: "Scan échoué",
    tone: "danger",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500/15",
  },
};

export function getComplianceScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function getComplianceScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
