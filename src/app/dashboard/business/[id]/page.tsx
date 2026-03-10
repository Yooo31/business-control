import { ExternalLink, History, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { SurfaceCard } from "@/components/shared/surface-card";
import { ComplianceBar } from "@/features/dashboard/components/compliance-bar";
import { MismatchList } from "@/features/dashboard/components/mismatch-list";
import { PlatformStatusBadge } from "@/features/dashboard/components/platform-status-badge";
import { ScanStateBadge } from "@/features/dashboard/components/scan-state-badge";
import { getDashboardBusinessDetail } from "@/features/dashboard/data";

type BusinessDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function BusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const { id } = await params;
  const business = await getDashboardBusinessDetail(id);

  return (
    <PageShell className="py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="text-primary text-sm font-medium transition-opacity hover:opacity-70"
        >
          Retour au dashboard
        </Link>
        <ScanStateBadge state={business.scanState} />
      </div>

      <SurfaceCard className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_42%,white)_0%,transparent_82%)] px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                Fiche entreprise
              </p>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                  {business.name}
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-7">
                  Source de verite, statuts plateformes, ecarts detectes et
                  historique recent sur une seule page.
                </p>
              </div>
            </div>
            <div className="min-w-[220px] rounded-[var(--radius-lg)] border border-white/60 bg-white/70 p-4">
              <p className="text-muted-foreground text-sm">Dernier scan</p>
              <p className="mt-1 text-lg font-semibold">{business.latestScanLabel}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Batch {business.latestBatchId ?? "indisponible"}
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <SurfaceCard className="space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-5" />
              <h2 className="text-xl font-semibold">Reference interne</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Denomination
                </p>
                <p className="font-medium">{business.reference.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Activite
                </p>
                <p className="font-medium">{business.activity ?? "Non renseignee"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">Email</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4" />
                  <span>{business.reference.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Telephone
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4" />
                  <span>{business.reference.phone}</span>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-muted-foreground text-xs uppercase">Adresse</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4" />
                  <span>{business.reference.address}</span>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-muted-foreground text-xs uppercase">Site web</p>
                <a
                  href={business.reference.website}
                  rel="noreferrer"
                  target="_blank"
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium"
                >
                  {business.reference.website}
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          </SurfaceCard>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Mismatches par plateforme</p>
              <p className="text-muted-foreground text-sm">
                Chaque ecart compare la source interne a la fiche publique
                detectee lors du dernier scan disponible.
              </p>
            </div>
            <MismatchList groups={business.mismatchesByPlatform} />
          </section>
        </div>

        <div className="space-y-6">
          <SurfaceCard className="space-y-5">
            <h2 className="text-xl font-semibold">Vue d&apos;ensemble</h2>
            <ComplianceBar score={business.score} />
            <div className="space-y-3">
              <p className="text-sm font-semibold">Plateformes</p>
              <div className="flex flex-wrap gap-2">
                {business.platforms.map((platform) => (
                  <PlatformStatusBadge
                    key={platform.key}
                    platform={platform.key}
                    status={platform.status}
                  />
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="text-primary size-5" />
              <h2 className="text-xl font-semibold">Historique recent</h2>
            </div>
            {business.scanHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun scan enregistre pour cette entreprise.
              </p>
            ) : (
              <ul className="space-y-3">
                {business.scanHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-[var(--radius-md)] border border-border/70 bg-background/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">
                        {formatDate(entry.completedAt ?? entry.startedAt ?? entry.createdAt)}
                      </p>
                      <span className="text-muted-foreground text-xs uppercase">
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span>{entry.platformCount} plateformes</span>
                      <span>{entry.mismatchesCount} erreurs detectees</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        </div>
      </div>
    </PageShell>
  );
}
