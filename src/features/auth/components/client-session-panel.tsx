"use client";

import { useSession } from "next-auth/react";

export function ClientSessionPanel() {
  const { data, status } = useSession();

  return (
    <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/85 p-5">
      <p className="text-sm font-semibold">Client session</p>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Status: {status}
      </p>
      <p className="text-muted-foreground text-sm leading-6">
        User: {data?.user.email ?? "Unavailable"}
      </p>
    </div>
  );
}
