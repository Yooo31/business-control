"use client";

import { Building2, Mail, MapPin, Phone, RefreshCcw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { SurfaceCard } from "@/components/shared/surface-card";
import { Button } from "@/components/ui/button";
import { ComplianceBar } from "@/features/dashboard/components/compliance-bar";
import { PlatformStatusBadge } from "@/features/dashboard/components/platform-status-badge";
import { ScanStateBadge } from "@/features/dashboard/components/scan-state-badge";
import type { DashboardBusinessSummary } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type BusinessCardProps = {
  business: DashboardBusinessSummary;
};

const terminalStatuses = new Set(["completed", "failed"]);

function formatDate(value: Date | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BusinessCard({ business }: BusinessCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scanBatchId, setScanBatchId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const detailHref = `/dashboard/business/${business.id}` as Route;

  useEffect(() => {
    if (!scanBatchId) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function poll(batchId: string) {
      try {
        const response = await fetch(`/api/scans/${batchId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Impossible de rafraichir le scan.");
        }

        const payload = (await response.json()) as { status: string };

        if (cancelled) {
          return;
        }

        if (terminalStatuses.has(payload.status)) {
          setScanBatchId(null);
          setIsPolling(false);
          router.refresh();
          return;
        }

        timeoutId = setTimeout(() => {
          void poll(batchId);
        }, 2500);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setIsPolling(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de rafraichir le scan.",
        );
      }
    }

    setIsPolling(true);
    void poll(scanBatchId);

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router, scanBatchId]);

  function handleScanNow() {
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/scans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: business.id,
            }),
          });
          const payload = (await response.json()) as {
            message?: string;
            scanBatchId?: string;
          };

          if (!response.ok || !payload.scanBatchId) {
            throw new Error(payload.message ?? "Impossible de lancer le scan.");
          }

          setScanBatchId(payload.scanBatchId);
          setIsPolling(true);
          router.refresh();
          toast.success("Scan lance.");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Impossible de lancer le scan.",
          );
        }
      })();
    });
  }

  return (
    <SurfaceCard className="relative overflow-hidden p-0">
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_42%,white)_0%,transparent_85%)]" />
      <div className="relative flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Building2 className="size-5" />
            </div>
            <div className="space-y-1">
              <Link
                href={detailHref}
                className="text-lg font-semibold tracking-[-0.02em] text-foreground transition-opacity hover:opacity-70"
              >
                {business.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                Dernier scan: {formatDate(business.lastScanAt)}
              </p>
            </div>
          </div>
          <ScanStateBadge state={isPolling ? "scanning" : business.scanState} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0" />
            <span>{business.email}</span>
          </div>
          <div className="text-muted-foreground flex items-start gap-2">
            <Phone className="mt-0.5 size-4 shrink-0" />
            <span>{business.phone}</span>
          </div>
          <div className="text-muted-foreground flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>{business.address}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {business.platforms.map((platform) => (
            <PlatformStatusBadge
              key={platform.key}
              platform={platform.key}
              status={isPolling ? "scanning" : platform.status}
            />
          ))}
        </div>

        <ComplianceBar score={business.score} />

        <div className="mt-auto flex items-center justify-between gap-3">
          <Link
            href={detailHref}
            className="text-primary text-sm font-medium"
          >
            Voir le detail
          </Link>
          <Button
            className={cn(isPolling && "animate-pulse")}
            disabled={isPending || isPolling}
            onClick={handleScanNow}
            size="sm"
            variant="outline"
          >
            <RefreshCcw className="size-4" />
            {isPolling ? "Scan en cours" : "Scan now"}
          </Button>
        </div>
      </div>
    </SurfaceCard>
  );
}
