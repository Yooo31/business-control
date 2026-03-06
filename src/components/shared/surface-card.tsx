import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-card/90 rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-sm)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
