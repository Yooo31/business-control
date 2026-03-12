import { cn } from "@/lib/utils";

import { getComplianceScoreBgColor } from "../status-mapping";

type ComplianceProgressBarProps = {
  score: number;
  className?: string;
  showLabel?: boolean;
};

export function ComplianceProgressBar({
  score,
  className,
  showLabel = true,
}: ComplianceProgressBarProps) {
  const bgColor = getComplianceScoreBgColor(score);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", bgColor)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium tabular-nums text-foreground">
          {score}%
        </span>
      )}
    </div>
  );
}
