import { getScanStatePresentation } from "@/features/dashboard/status";
import type { DashboardScanState } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type ScanStateBadgeProps = {
  state: DashboardScanState;
};

export function ScanStateBadge({ state }: ScanStateBadgeProps) {
  const presentation = getScanStatePresentation(state);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        presentation.className,
      )}
    >
      {presentation.label}
    </span>
  );
}
