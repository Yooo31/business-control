import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { SurfaceCard } from "@/components/shared/surface-card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { DashboardList } from "@/features/dashboard/components/dashboard-list";
import { getDashboardBusinesses } from "@/features/dashboard/data";
import { requireOnboardedUser } from "@/features/onboarding/lib";

export default async function DashboardPage() {
  const [user, businesses] = await Promise.all([
    requireOnboardedUser(),
    getDashboardBusinesses(),
  ]);
  const hasBusinesses = businesses.length > 0;

  return (
    <PageShell className="py-8">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,white)_0%,color-mix(in_srgb,var(--accent)_28%,white)_52%,transparent_100%)] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                Dashboard
              </p>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  {user.name ? `${user.name}, ` : ""}
                  vos fiches locales.
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-7">
                  Consultez vos entreprises surveillees, voyez l&apos;etat de
                  Google, Apple et Yelp, puis relancez un scan sans quitter
                  cette page.
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </SurfaceCard>

      {hasBusinesses ? (
        <DashboardList businesses={businesses} />
      ) : (
        <SurfaceCard className="border-dashed p-10 text-center">
          <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
            Empty state
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Aucune entreprise a surveiller pour l&apos;instant
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-base leading-7">
            Ajoutez votre premiere entreprise pour demarrer les scans, suivre
            les statuts des plateformes et afficher vos futurs ecarts.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/onboarding"
              className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold"
            >
              Ajouter une entreprise
            </Link>
          </div>
        </SurfaceCard>
      )}
    </PageShell>
  );
}
