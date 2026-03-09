import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/shared/logo-mark";

type AuthShellProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[var(--radius-xl)] border border-border/70 bg-card/75 p-8 shadow-[var(--shadow-md)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <Link href="/" className="inline-flex">
              <LogoMark />
            </Link>
            <div className="space-y-4">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                Private workspace
              </p>
              <h1 className="max-w-md text-5xl leading-[0.92] font-semibold tracking-[-0.06em] text-balance">
                Control your business operations from one secure place.
              </h1>
              <p className="text-muted-foreground max-w-lg text-base leading-7">
                Authentication, sessions and protected application routes are
                wired around NextAuth, Prisma and Supabase.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/90 p-4">
              <p className="text-sm font-semibold">Credentials auth</p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Email and password are ready for local iteration.
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/90 p-4">
              <p className="text-sm font-semibold">Protected pages</p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Unauthenticated users are redirected before rendering.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border/70 bg-card/92 p-6 shadow-[var(--shadow-md)] backdrop-blur sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                BusinessControl
              </p>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-[-0.05em]">
                  {title}
                </h2>
                <p className="text-muted-foreground max-w-md text-sm leading-7">
                  {description}
                </p>
              </div>
            </div>
            {children}
            <div className="text-muted-foreground border-border/70 border-t pt-5 text-sm">
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
