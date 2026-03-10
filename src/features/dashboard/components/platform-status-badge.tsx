import {
  getPlatformStatusPresentation,
  PLATFORM_META,
} from "@/features/dashboard/status";
import type {
  DashboardPlatformKey,
  DashboardPlatformStatus,
} from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type PlatformStatusBadgeProps = {
  platform: DashboardPlatformKey;
  status: DashboardPlatformStatus;
};

export function PlatformStatusBadge({
  platform,
  status,
}: PlatformStatusBadgeProps) {
  const presentation = getPlatformStatusPresentation(status);
  const meta = PLATFORM_META[platform];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        presentation.className,
      )}
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-white/70 text-[0.65rem] font-semibold">
        {meta.shortLabel}
      </span>
      <span>{meta.label}</span>
      <span className="opacity-70">{presentation.label}</span>
    </div>
  );
}
