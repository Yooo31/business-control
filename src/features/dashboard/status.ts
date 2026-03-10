import type {
  DashboardPlatformKey,
  DashboardPlatformStatus,
  DashboardScanState,
} from "@/features/dashboard/types";

export const PLATFORM_META: Record<
  DashboardPlatformKey,
  { label: string; shortLabel: string }
> = {
  google: {
    label: "Google",
    shortLabel: "G",
  },
  apple: {
    label: "Apple",
    shortLabel: "A",
  },
  yelp: {
    label: "Yelp",
    shortLabel: "Y",
  },
};

export function getPlatformStatusPresentation(status: DashboardPlatformStatus) {
  switch (status) {
    case "ok":
      return {
        label: "Conforme",
        className:
          "border-transparent bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
      };
    case "error":
      return {
        label: "Erreur",
        className:
          "border-transparent bg-rose-100 text-rose-700 ring-1 ring-rose-200/80",
      };
    case "needs_review":
      return {
        label: "A revoir",
        className:
          "border-transparent bg-amber-100 text-amber-700 ring-1 ring-amber-200/80",
      };
    case "scanning":
      return {
        label: "Scan",
        className:
          "border-transparent bg-sky-100 text-sky-700 ring-1 ring-sky-200/80",
      };
    case "not_linked":
      return {
        label: "Non lie",
        className:
          "border-border/80 bg-muted text-muted-foreground ring-1 ring-border/80",
      };
  }
}

export function getScanStatePresentation(state: DashboardScanState) {
  switch (state) {
    case "completed":
      return {
        label: "Scan termine",
        className:
          "border-transparent bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
      };
    case "failed":
      return {
        label: "Scan en erreur",
        className:
          "border-transparent bg-rose-100 text-rose-700 ring-1 ring-rose-200/80",
      };
    case "scanning":
      return {
        label: "Scan en cours",
        className:
          "border-transparent bg-sky-100 text-sky-700 ring-1 ring-sky-200/80",
      };
    case "never_scanned":
      return {
        label: "Jamais scanne",
        className:
          "border-border/80 bg-muted text-muted-foreground ring-1 ring-border/80",
      };
  }
}
