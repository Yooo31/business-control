import type { ListingField, MismatchSeverity } from "@/generated/prisma/client";

import { cn } from "@/lib/utils";

type Mismatch = {
  id: string;
  field: ListingField;
  expectedValue: string | null;
  actualValue: string | null;
  severity: MismatchSeverity;
};

type MismatchListProps = {
  mismatches: Mismatch[];
  className?: string;
};

const fieldLabels: Record<ListingField, string> = {
  NAME: "Nom",
  ADDRESS: "Adresse",
  PHONE: "Téléphone",
  EMAIL: "Email",
  WEBSITE: "Site web",
  HOURS: "Horaires",
};

const severityColors: Record<MismatchSeverity, { bg: string; text: string; label: string }> = {
  HIGH: {
    bg: "bg-rose-500/15",
    text: "text-rose-600",
    label: "Critique",
  },
  MEDIUM: {
    bg: "bg-amber-500/15",
    text: "text-amber-600",
    label: "Moyen",
  },
  LOW: {
    bg: "bg-blue-500/15",
    text: "text-blue-600",
    label: "Faible",
  },
};

export function MismatchList({ mismatches, className }: MismatchListProps) {
  if (mismatches.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {mismatches.map((mismatch) => {
        const severity = severityColors[mismatch.severity];
        return (
          <div
            key={mismatch.id}
            className="rounded-[var(--radius-md)] border border-border/60 bg-background/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">
                {fieldLabels[mismatch.field]}
              </p>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  severity.bg,
                  severity.text,
                )}
              >
                {severity.label}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] bg-emerald-500/10 px-3 py-2">
                <p className="text-xs font-medium text-emerald-600">Attendu</p>
                <p className="mt-1 text-sm text-foreground">
                  {mismatch.expectedValue || <span className="text-muted-foreground italic">Non défini</span>}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-rose-500/10 px-3 py-2">
                <p className="text-xs font-medium text-rose-600">Observé</p>
                <p className="mt-1 text-sm text-foreground">
                  {mismatch.actualValue || <span className="text-muted-foreground italic">Non trouvé</span>}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NoMismatchState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed border-emerald-500/50 bg-emerald-500/5 p-6 text-center",
        className,
      )}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <svg
          className="size-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-emerald-600">
        Aucune incohérence détectée
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Toutes les informations sont conformes à votre source de vérité.
      </p>
    </div>
  );
}
