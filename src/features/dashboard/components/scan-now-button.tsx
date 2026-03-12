"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

type ScanNowButtonProps = {
  businessId?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

export function ScanNowButton({
  businessId,
  variant = "default",
  size = "default",
}: ScanNowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleScan() {
    startTransition(async () => {
      try {
        const payload = businessId
          ? { businessId }
          : { allBusinesses: true };

        const response = await fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message ?? "Impossible de lancer le scan.");
        }

        toast.success("Scan lancé avec succès !");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Impossible de lancer le scan.",
        );
      }
    });
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={handleScan}
    >
      {isPending ? (
        <svg
          className="size-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className="size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      )}
      {businessId ? "Scanner" : "Scanner tout"}
    </Button>
  );
}
