"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { PlatformName } from "@/generated/prisma/client";

type ListingLinkFormProps = {
  businessId: string;
  platform: PlatformName;
  currentUrl?: string | null | undefined;
};

const platformPlaceholders: Record<PlatformName, string> = {
  GOOGLE: "https://google.com/maps/place/...",
  APPLE: "https://maps.apple.com/place?...",
  YELP: "https://yelp.com/biz/...",
};

export function ListingLinkForm({
  businessId,
  platform,
  currentUrl,
}: ListingLinkFormProps) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(!currentUrl);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const platformKey = platform.toLowerCase() as "google" | "apple" | "yelp";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("L'URL est requise.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/businesses/${businessId}/listings/${platformKey}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim() }),
          },
        );

        const data = (await response.json()) as { message?: string };

        if (!response.ok) {
          setError(data.message ?? "Une erreur est survenue.");
          return;
        }

        toast.success(data.message ?? "Fiche liée avec succès.");
        setIsEditing(false);
        router.refresh();
      } catch {
        setError("Impossible de lier la fiche pour le moment.");
      }
    });
  }

  async function handleRemove() {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/businesses/${businessId}/listings/${platformKey}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const data = (await response.json()) as { message?: string };
          toast.error(data.message ?? "Une erreur est survenue.");
          return;
        }

        toast.success("Fiche supprimée.");
        setUrl("");
        setIsEditing(true);
        router.refresh();
      } catch {
        toast.error("Impossible de supprimer la fiche pour le moment.");
      }
    });
  }

  if (!isEditing && currentUrl) {
    return (
      <div className="space-y-3">
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm text-primary hover:underline"
        >
          {currentUrl}
        </a>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setIsEditing(true)}
          >
            Modifier
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRemove}
            className="text-destructive hover:bg-destructive/10"
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={platformPlaceholders[platform]}
          disabled={isPending}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Lier la fiche"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setUrl(currentUrl);
              setIsEditing(false);
            }}
          >
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
