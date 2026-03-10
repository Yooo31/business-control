import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

import { PlatformStatusBadge } from "@/features/dashboard/components/platform-status-badge";
import type { DashboardBusinessDetail } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type MismatchListProps = {
  groups: DashboardBusinessDetail["mismatchesByPlatform"];
};

function severityTone(severity: string) {
  switch (severity) {
    case "high":
      return "bg-rose-100 text-rose-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function MismatchList({ groups }: MismatchListProps) {
  const totalMismatches = groups.reduce((sum, group) => sum + group.count, 0);

  if (totalMismatches === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Aucune incoherence detectee</p>
            <p className="text-sm">
              Toutes les plateformes liees sont conformes ou ne remontent pas
              d&apos;ecart sur le dernier scan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.platformKey}
          className="rounded-[var(--radius-lg)] border border-border/80 bg-card/90 p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{group.platformLabel}</h3>
                <PlatformStatusBadge
                  platform={group.platformKey}
                  status={group.status}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {group.count} ecart{group.count > 1 ? "s" : ""} detecte
                {group.count > 1 ? "s" : ""}
                {typeof group.score === "number"
                  ? ` · Score ${String(group.score)}%`
                  : ""}
              </p>
            </div>
            {group.url ? (
              <a
                href={group.url}
                rel="noreferrer"
                target="_blank"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium"
              >
                Ouvrir la fiche
                <ExternalLink className="size-4" />
              </a>
            ) : null}
          </div>

          {group.mismatches.length === 0 ? (
            <div className="text-muted-foreground mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-border/80 bg-muted/40 p-4 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>Aucun mismatch visible pour cette plateforme.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {group.mismatches.map((mismatch) => (
                <li
                  key={mismatch.id}
                  className="rounded-[var(--radius-md)] border border-border/70 bg-background/85 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium capitalize text-foreground">
                      {mismatch.field}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase",
                        severityTone(mismatch.severity),
                      )}
                    >
                      {mismatch.severity}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--radius-sm)] bg-muted/70 p-3">
                      <p className="text-muted-foreground text-xs uppercase">
                        Valeur attendue
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {mismatch.expectedValue ?? "Aucune valeur"}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-rose-50/70 p-3">
                      <p className="text-rose-600 text-xs uppercase">
                        Valeur observee
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {mismatch.actualValue ?? "Aucune valeur"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
