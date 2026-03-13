import Link from "next/link";
import { notFound } from "next/navigation";

import type { PlatformListingStatus } from "@/generated/prisma/client";

import {
  ComplianceProgressBar,
  ListingLinkForm,
  MismatchList,
  NoMismatchState,
  PlatformStatusBadge,
  ScanNowButton,
  ScanStatusBadge,
} from "@/features/dashboard/components";
import { getBusinessDetail } from "@/features/dashboard/queries";
import { platformStatusMap, scanBatchStatusMap } from "@/features/dashboard/status-mapping";
import { requireOnboardedUser } from "@/features/onboarding/lib";

type BusinessDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const business = await getBusinessDetail(id, user.id);

  if (!business) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Back Link + Header */}
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="group/button inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-transparent bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <svg
            className="size-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour au dashboard
        </Link>

        <section className="rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-8 shadow-[var(--shadow-md)] backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-primary">
                <svg
                  className="size-7"
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
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    {business.name}
                  </h1>
                  <ScanStatusBadge state={business.scanState} />
                </div>
                <p className="text-muted-foreground text-base">
                  {business.legalName && business.legalName !== business.name
                    ? business.legalName
                    : business.activity ?? "Entreprise surveillée"}
                </p>
              </div>
            </div>
            <ScanNowButton businessId={business.id} />
          </div>
        </section>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Source of Truth */}
          <section className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-sm)] backdrop-blur">
            <h2 className="text-lg font-semibold">Informations de référence</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Ces données constituent votre source de vérité pour la comparaison.
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoItem label="Dénomination" value={business.name} />
              <InfoItem label="Adresse" value={business.address} />
              <InfoItem label="Téléphone" value={business.phone} />
              <InfoItem label="Email" value={business.email} />
              <InfoItem label="Site internet" value={business.website} isLink />
              {business.siren && <InfoItem label="SIREN" value={business.siren} />}
            </dl>
          </section>

          {/* Platforms */}
          <section className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-sm)] backdrop-blur">
            <h2 className="text-lg font-semibold">Plateformes surveillées</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              État de vos fiches sur chaque plateforme.
            </p>

            <div className="mt-5 space-y-4">
              {(["GOOGLE", "APPLE", "YELP"] as const).map((platform) => {
                const listing = business.platformListings.find(
                  (p) => p.platform === platform,
                );
                const status: PlatformListingStatus = listing?.status ?? "NOT_LINKED";
                const statusDisplay = platformStatusMap[status] ?? platformStatusMap.NOT_LINKED;

                return (
                  <div
                    key={platform}
                    className="rounded-[var(--radius-md)] border border-border/60 bg-background/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PlatformStatusBadge platform={platform} status={status} />
                        {listing?.url && (
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Voir la fiche →
                          </a>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className={statusDisplay.colorClass}>
                          {statusDisplay.label}
                        </p>
                        {listing?.lastScannedAt && (
                          <p className="text-xs text-muted-foreground">
                            Scanné le{" "}
                            {new Date(listing.lastScannedAt).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {listing && listing.complianceScore > 0 && (
                      <div className="mt-3">
                        <ComplianceProgressBar score={listing.complianceScore} />
                      </div>
                    )}

                    {listing && listing.mismatches.length > 0 ? (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-foreground">
                          Incohérences détectées
                        </p>
                        <MismatchList mismatches={listing.mismatches} />
                      </div>
                    ) : listing && listing.status === "LINKED" ? (
                      <div className="mt-4">
                        <NoMismatchState />
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-border/40 pt-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {listing?.url ? "URL de la fiche" : "Lier manuellement"}
                      </p>
                      <ListingLinkForm
                        businessId={business.id}
                        platform={platform}
                        currentUrl={listing?.url}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Compliance Score */}
          <section className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-sm)] backdrop-blur">
            <h2 className="text-lg font-semibold">Score de conformité</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Score moyen sur toutes les plateformes.
            </p>
            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums text-foreground">
                  {business.complianceScore}
                </span>
                <span className="text-2xl text-muted-foreground">%</span>
              </div>
              <ComplianceProgressBar
                score={business.complianceScore}
                showLabel={false}
                className="mt-3"
              />
            </div>
          </section>

          {/* Scan History */}
          <section className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-sm)] backdrop-blur">
            <h2 className="text-lg font-semibold">Historique des scans</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Dernières analyses effectuées.
            </p>

            {business.scanHistory.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {business.scanHistory.slice(0, 5).map((scan) => {
                  const statusDisplay = scanBatchStatusMap[scan.status as keyof typeof scanBatchStatusMap];
                  return (
                    <li
                      key={scan.batchId}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(scan.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scan.platformsCount} plateforme
                          {scan.platformsCount > 1 ? "s" : ""}
                          {scan.errorsCount > 0
                            ? ` · ${scan.errorsCount} erreur${scan.errorsCount > 1 ? "s" : ""}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusDisplay?.bgClass ?? "bg-muted"} ${statusDisplay?.colorClass ?? "text-muted-foreground"}`}
                      >
                        {statusDisplay?.label ?? scan.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun scan effectué pour le moment.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-foreground">
        {value ? (
          isLink ? (
            <a
              href={value.startsWith("http") ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-muted-foreground italic">Non renseigné</span>
        )}
      </dd>
    </div>
  );
}
