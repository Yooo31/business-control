"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

type CompanyOption = {
  city: string | null;
  id: string;
  name: string;
};

type ScanJobSummary = {
  businessId: string;
  id: string;
  platform: string;
  status: string;
};

type ScanLaunchResponse = {
  businessIds: string[];
  jobs: ScanJobSummary[];
  scanBatchId: string;
};

type ScanBusinessGroup = {
  businessId: string;
  businessName: string;
  jobs: {
    id: string;
    listing: {
      complianceScore: number;
      id: string;
      status: string;
      url: string | null;
    } | null;
    platform: string;
    status: string;
  }[];
};

type ScanStatusResponse = {
  businesses: ScanBusinessGroup[];
  completedAt: string | null;
  completedJobs: number;
  createdAt: string;
  id: string;
  startedAt: string | null;
  status: string;
  totalJobs: number;
};

type ScannerPanelProps = {
  companies: CompanyOption[];
};

const terminalStatuses = new Set(["completed", "failed"]);

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusTone(status: string) {
  switch (status) {
    case "completed":
    case "success":
    case "ok":
      return "text-emerald-600";
    case "failed":
    case "error":
      return "text-rose-600";
    case "needs_review":
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
}

export function ScannerPanel({ companies }: ScannerPanelProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    companies[0]?.id ?? "",
  );
  const [scanBatchId, setScanBatchId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!scanBatchId) {
      return;
    }

    const currentScanBatchId = scanBatchId;
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/scans/${currentScanBatchId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to refresh scan status.");
        }

        const payload = (await response.json()) as ScanStatusResponse;

        if (isCancelled) {
          return;
        }

        setScanStatus(payload);
        setIsPolling(!terminalStatuses.has(payload.status));

        if (!terminalStatuses.has(payload.status)) {
          timeoutId = setTimeout(() => {
            void poll();
          }, 2500);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setIsPolling(false);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to refresh scan status.",
        );
      }
    }

    setIsPolling(true);
    void poll();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [scanBatchId]);

  async function launchScan(payload: { allBusinesses?: true; businessId?: string }) {
    const response = await fetch("/api/scans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as ScanLaunchResponse | { message?: string };

    if (!response.ok) {
      throw new Error(
        "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to launch scan.",
      );
    }

    return result as ScanLaunchResponse;
  }

  function handleLaunchSingleBusinessScan() {
    startTransition(() => {
      void (async () => {
      try {
        const result = await launchScan({ businessId: selectedBusinessId });

        setScanBatchId(result.scanBatchId);
        setScanStatus(null);
        toast.success("Scan launched.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to launch scan.",
        );
      }
      })();
    });
  }

  function handleLaunchAllBusinessesScan() {
    startTransition(() => {
      void (async () => {
      try {
        const result = await launchScan({ allBusinesses: true });

        setScanBatchId(result.scanBatchId);
        setScanStatus(null);
        toast.success("Full scan launched.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to launch scan.",
        );
      }
      })();
    });
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Scanner</p>
          <p className="text-muted-foreground text-sm leading-6">
            Lance un scan manuel depuis le dashboard puis suis l&apos;etat du
            batch sans passer par Prisma Studio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isPending || companies.length === 0 || selectedBusinessId === ""}
            onClick={handleLaunchSingleBusinessScan}
          >
            Scanner l&apos;entreprise
          </Button>
          <Button
            disabled={isPending || companies.length === 0}
            onClick={handleLaunchAllBusinessesScan}
            variant="outline"
          >
            Scanner tout
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-foreground" htmlFor="scanner-business">
          Entreprise
        </label>
        <select
          id="scanner-business"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 min-w-0 rounded-[var(--radius-md)] border px-3 text-sm outline-none focus-visible:ring-3 sm:min-w-80"
          onChange={(event) => {
            setSelectedBusinessId(event.target.value);
          }}
          value={selectedBusinessId}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
              {company.city ? ` · ${company.city}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 rounded-[var(--radius-md)] border border-border/60 bg-background/70 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Dernier batch</p>
            <p className="text-muted-foreground text-xs">
              {scanBatchId ? `ID ${scanBatchId}` : "Aucun scan lance depuis ce dashboard"}
            </p>
          </div>
          <p
            className={`text-sm font-medium ${
              scanStatus ? statusTone(scanStatus.status) : "text-muted-foreground"
            }`}
          >
            {scanStatus
              ? formatStatusLabel(scanStatus.status)
              : isPending
                ? "launching"
                : "idle"}
            {isPolling ? " · polling" : ""}
          </p>
        </div>

        {scanStatus ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-md)] border border-border/60 px-3 py-2">
                <p className="text-muted-foreground text-xs uppercase">
                  Jobs termines
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {scanStatus.completedJobs}/{scanStatus.totalJobs}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/60 px-3 py-2">
                <p className="text-muted-foreground text-xs uppercase">Demarre</p>
                <p className="mt-1 text-sm font-medium">
                  {scanStatus.startedAt
                    ? new Date(scanStatus.startedAt).toLocaleString()
                    : "Pas encore"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/60 px-3 py-2">
                <p className="text-muted-foreground text-xs uppercase">Termine</p>
                <p className="mt-1 text-sm font-medium">
                  {scanStatus.completedAt
                    ? new Date(scanStatus.completedAt).toLocaleString()
                    : "En cours"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {scanStatus.businesses.map((business) => (
                <div
                  key={business.businessId}
                  className="rounded-[var(--radius-md)] border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {business.businessName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {business.jobs.length} plateformes
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {business.jobs.map((job) => (
                      <li
                        key={job.id}
                        className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-border/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {job.platform}
                          </p>
                          <p className={`text-xs ${statusTone(job.status)}`}>
                            {formatStatusLabel(job.status)}
                          </p>
                        </div>
                        <div className="text-muted-foreground text-xs sm:text-right">
                          <p>
                            Listing:{" "}
                            {job.listing
                              ? formatStatusLabel(job.listing.status)
                              : "none"}
                          </p>
                          <p>
                            Score:{" "}
                            {job.listing
                              ? `${String(job.listing.complianceScore)}%`
                              : "-"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
