"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/features/dashboard/components/business-card";
import type { DashboardBusinessSummary } from "@/features/dashboard/types";

type DashboardListProps = {
  businesses: DashboardBusinessSummary[];
};

export function DashboardList({ businesses }: DashboardListProps) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Entreprises surveillees</p>
          <p className="text-muted-foreground text-sm">
            Vue d&apos;ensemble des statuts, scores et derniers scans.
          </p>
        </div>
        <Button
          onClick={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
          size="sm"
          variant="outline"
        >
          <RefreshCcw className="size-4" />
          Rafraichir
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
}
