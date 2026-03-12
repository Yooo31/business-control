import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <section className="rounded-[var(--radius-xl)] border border-dashed border-border bg-card/80 p-8 text-center shadow-[var(--shadow-sm)]">
      {/* Icon */}
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg
          className="size-8"
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

      <p className="text-primary mt-4 text-xs font-semibold tracking-[0.22em] uppercase">
        Aucune entreprise
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
        Commencez à surveiller vos fiches
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-md text-base leading-7">
        Ajoutez votre première entreprise pour commencer à surveiller vos fiches
        Google, Apple et Yelp.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/onboarding" className={buttonVariants()}>
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Ajouter une entreprise
        </Link>
      </div>
    </section>
  );
}
