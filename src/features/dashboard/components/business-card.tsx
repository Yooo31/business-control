import Link from "next/link";

import type { PlatformListingStatus, PlatformName } from "@/generated/prisma/client";

import { cn } from "@/lib/utils";

import { type BusinessScanState } from "../status-mapping";
import { ComplianceProgressBar } from "./compliance-progress-bar";
import { PlatformStatusDots } from "./platform-status-badge";
import { ScanStatusBadge } from "./scan-status-badge";

type BusinessCardProps = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  platforms: Array<{
    platform: PlatformName;
    status: PlatformListingStatus;
  }>;
  complianceScore: number;
  scanState: BusinessScanState;
  className?: string;
};

export function BusinessCard({
  id,
  name,
  email,
  phone,
  address,
  platforms,
  complianceScore,
  scanState,
  className,
}: BusinessCardProps) {
  return (
    <Link
      href={`/dashboard/business/${id}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border/80 bg-card/90 p-5 shadow-[var(--shadow-sm)] backdrop-blur transition-all hover:border-border hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Building Icon */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
            <svg
              className="size-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" />
              <path d="M16 6h.01" />
              <path d="M12 6h.01" />
              <path d="M12 10h.01" />
              <path d="M12 14h.01" />
              <path d="M16 10h.01" />
              <path d="M16 14h.01" />
              <path d="M8 10h.01" />
              <path d="M8 14h.01" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {email && <p className="truncate">{email}</p>}
              {phone && <p className="truncate">{phone}</p>}
              {address && <p className="truncate">{address}</p>}
            </div>
          </div>
        </div>
        <ScanStatusBadge state={scanState} />
      </div>

      {/* Platform Statuses */}
      <PlatformStatusDots platforms={platforms} />

      {/* Compliance Score */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Conformité</p>
        <ComplianceProgressBar score={complianceScore} />
      </div>

      {/* Hover Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="size-5 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border/80 bg-card/90 p-5 shadow-[var(--shadow-sm)] backdrop-blur animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-[var(--radius-md)] bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>

      {/* Platform Statuses */}
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-md bg-muted" />
        <div className="h-6 w-16 rounded-md bg-muted" />
        <div className="h-6 w-16 rounded-md bg-muted" />
      </div>

      {/* Compliance Score */}
      <div className="space-y-1.5">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-2 w-full rounded-full bg-muted" />
      </div>
    </div>
  );
}
