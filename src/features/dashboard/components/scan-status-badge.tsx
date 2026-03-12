import { cn } from "@/lib/utils";

import {
  businessScanStateMap,
  type BusinessScanState,
} from "../status-mapping";

type ScanStatusBadgeProps = {
  state: BusinessScanState;
  className?: string;
};

export function ScanStatusBadge({ state, className }: ScanStatusBadgeProps) {
  const statusDisplay = businessScanStateMap[state];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        statusDisplay.bgClass,
        statusDisplay.colorClass,
        className,
      )}
    >
      {state === "scanning" && (
        <svg
          className="size-3 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span>{statusDisplay.label}</span>
    </div>
  );
}
