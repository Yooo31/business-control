"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

import type {
  ListingField,
  MismatchSeverity,
  PlatformName,
  PlatformListingStatus,
} from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";

import { platformStatusMap } from "../status-mapping";
import { ComplianceProgressBar } from "./compliance-progress-bar";
import { MismatchList, NoMismatchState } from "./mismatch-list";
import { PlatformStatusBadge } from "./platform-status-badge";

type BusinessPlatformCardProps = {
  businessId: string;
  listing: {
    complianceScore: number;
    discoveryConfidence: number | null;
    id: string;
    isUserVerified: boolean;
    lastScannedAt: string | null;
    mismatches: Array<{
      actualValue: string | null;
      expectedValue: string | null;
      field: ListingField;
      id: string;
      severity: MismatchSeverity;
    }>;
    platform: PlatformName;
    status: PlatformListingStatus;
    url: string | null;
  } | null;
  platform: PlatformName;
};

function getPlatformSlug(platform: PlatformName) {
  switch (platform) {
    case "GOOGLE":
      return "google";
    case "APPLE":
      return "apple";
    case "YELP":
      return "yelp";
  }
}

export function BusinessPlatformCard({
  businessId,
  listing,
  platform,
}: BusinessPlatformCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(listing?.url ?? "");
  const [error, setError] = useState<string | null>(null);

  const status = listing?.status ?? "NOT_LINKED";
  const statusDisplay = platformStatusMap[status];
  const platformSlug = getPlatformSlug(platform);

  function handleSubmit() {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(
          `/api/businesses/${businessId}/platform-listings/${platformSlug}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          },
        );

        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(
            payload.message ?? "Impossible d'enregistrer la fiche.",
          );
        }

        toast.success("Fiche enregistree. Scan relance.");
        setIsEditing(false);
        router.refresh();
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : "Impossible d'enregistrer la fiche.";
        setError(message);
        toast.error(message);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(
          `/api/businesses/${businessId}/platform-listings/${platformSlug}`,
          {
            method: "DELETE",
          },
        );

        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(
            payload.message ?? "Impossible de supprimer la fiche.",
          );
        }

        toast.success("Fiche supprimee.");
        setUrl("");
        setIsEditing(false);
        router.refresh();
      } catch (removeError) {
        const message =
          removeError instanceof Error
            ? removeError.message
            : "Impossible de supprimer la fiche.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="border-border/60 bg-background/70 rounded-[var(--radius-md)] border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <PlatformStatusBadge platform={platform} status={status} />
          {listing?.url ? (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground decoration-border hover:text-primary block text-sm underline underline-offset-4"
            >
              {listing.url}
            </a>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune URL associee.
            </p>
          )}
          <div className="space-y-1 text-sm">
            <p className={statusDisplay.colorClass}>
              Status : {statusDisplay.label}
            </p>
            {listing?.lastScannedAt ? (
              <p className="text-muted-foreground">
                Last scan:{" "}
                {new Date(listing.lastScannedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
            {listing?.status === "NEEDS_REVIEW" &&
            listing.discoveryConfidence !== null ? (
              <p className="text-amber-600">
                Possible listing found ({listing.discoveryConfidence}%)
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <Button
                variant={listing?.url ? "outline" : "default"}
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setUrl(listing?.url ?? "");
                  setError(null);
                  setIsEditing(true);
                }}
              >
                {listing?.url ? "Change listing" : "Add listing URL"}
              </Button>
              {listing?.url ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={handleRemove}
                >
                  Remove listing
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="border-border/60 bg-card/80 mt-4 space-y-3 rounded-[var(--radius-md)] border p-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Listing URL</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 flex h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm shadow-xs transition outline-none focus-visible:ring-4"
            />
          </label>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={isPending} onClick={handleSubmit}>
              {isPending ? "Saving..." : "Save and scan"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setIsEditing(false);
                setUrl(listing?.url ?? "");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {listing && listing.complianceScore > 0 ? (
        <div className="mt-4">
          <ComplianceProgressBar score={listing.complianceScore} />
        </div>
      ) : null}

      {listing && listing.mismatches.length > 0 ? (
        <div className="mt-4">
          <p className="text-foreground mb-2 text-sm font-medium">
            Incohérences détectées
          </p>
          <MismatchList mismatches={listing.mismatches} />
        </div>
      ) : listing?.status === "LINKED" && listing.lastScannedAt ? (
        <div className="mt-4">
          <NoMismatchState />
        </div>
      ) : null}
    </div>
  );
}
