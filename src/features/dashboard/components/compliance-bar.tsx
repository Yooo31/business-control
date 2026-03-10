import { cn } from "@/lib/utils";

type ComplianceBarProps = {
  score: number;
};

function getTone(score: number) {
  if (score >= 80) {
    return "bg-emerald-500";
  }

  if (score >= 60) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

export function ComplianceBar({ score }: ComplianceBarProps) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Conformite globale</span>
        <span className="font-semibold text-foreground">{safeScore}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width]", getTone(safeScore))}
          style={{ width: `${String(safeScore)}%` }}
        />
      </div>
    </div>
  );
}
