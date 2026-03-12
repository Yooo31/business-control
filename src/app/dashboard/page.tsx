import { Suspense } from "react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  BusinessCard,
  BusinessCardSkeleton,
  DashboardEmptyState,
  ScanNowButton,
} from "@/features/dashboard/components";
import { getBusinessesForDashboard } from "@/features/dashboard/queries";
import { requireOnboardedUser } from "@/features/onboarding/lib";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-8 shadow-[var(--shadow-md)] backdrop-blur">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
              Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em]">
              Bienvenue{user.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-7">
              Surveillez la conformité de vos fiches Google, Apple et Yelp
              depuis un seul endroit.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>

      {/* Main Content */}
      <Suspense fallback={<BusinessListSkeleton />}>
        <BusinessList userId={user.id} />
      </Suspense>
    </main>
  );
}

async function BusinessList({ userId }: { userId: string }) {
  const businesses = await getBusinessesForDashboard(userId);

  if (businesses.length === 0) {
    return <DashboardEmptyState />;
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Entreprises"
        title="Vos entreprises surveillées"
        description="Cliquez sur une entreprise pour voir les détails et les incohérences détectées."
        action={<ScanNowButton />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            id={business.id}
            name={business.name}
            email={business.email}
            phone={business.phone}
            address={business.address}
            platforms={business.platforms}
            complianceScore={business.complianceScore}
            scanState={business.scanState}
          />
        ))}
      </div>
    </section>
  );
}

function BusinessListSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-5 w-96 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <BusinessCardSkeleton />
        <BusinessCardSkeleton />
      </div>
    </section>
  );
}
