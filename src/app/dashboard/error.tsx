"use client";

import { AlertTriangle } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { SurfaceCard } from "@/components/shared/surface-card";
import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <PageShell>
      <SurfaceCard className="max-w-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-rose-100 text-rose-700 flex size-11 items-center justify-center rounded-2xl">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">Le dashboard n&apos;a pas charge</p>
            <p className="text-muted-foreground text-sm">
              {error.message || "Une erreur serveur est survenue."}
            </p>
          </div>
        </div>
        <Button onClick={reset} variant="outline">
          Reessayer
        </Button>
      </SurfaceCard>
    </PageShell>
  );
}
