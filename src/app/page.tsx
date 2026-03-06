import { ArrowRight, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/shared/logo-mark";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { SurfaceCard } from "@/components/shared/surface-card";
import { Button } from "@/components/ui/button";
import { designSystemTokens, layout } from "@/lib/design-system";

const foundationAreas = [
  {
    title: "Design system first",
    description:
      "Semantic tokens, reusable layout conventions and shared components are ready before the product surface expands.",
    icon: Layers3,
  },
  {
    title: "Strict developer workflow",
    description:
      "Typed linting, formatting, type-checking and a lightweight test entry point are wired for daily work.",
    icon: ShieldCheck,
  },
  {
    title: "Release automation",
    description:
      "CI, GitHub releases and changelog automation are configured so the repository scales without manual glue.",
    icon: CheckCircle2,
  },
] as const;

const architectureAreas = [
  "src/app for routes and layouts",
  "src/components/ui for shadcn primitives",
  "src/components/shared for app-level reusable blocks",
  "src/lib/design-system for tokens and layout conventions",
  "src/features for future business domains",
] as const;

const tokenPreview = [
  {
    label: "Spacing",
    value: `${String(Object.keys(designSystemTokens.spacing).length)} tokens`,
  },
  {
    label: "Radius",
    value: `${String(Object.keys(designSystemTokens.radius).length)} tokens`,
  },
  {
    label: "Shadow",
    value: `${String(Object.keys(designSystemTokens.shadow).length)} elevations`,
  },
  {
    label: "Typography",
    value: `${String(Object.keys(designSystemTokens.typography).length)} scales`,
  },
] as const;

export default function HomePage() {
  return (
    <PageShell className="justify-center">
      <section className={layout.section}>
        <div className={layout.contentGrid}>
          <div className={layout.stack}>
            <div className={layout.cluster}>
              <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
                SaaS foundation
              </span>
              <span className="text-muted-foreground text-sm">
                Next.js 16, App Router, TypeScript, shadcn/ui
              </span>
            </div>
            <LogoMark />
            <div className="space-y-5">
              <h1 className="text-foreground max-w-4xl text-[clamp(3rem,8vw,5.5rem)] leading-[0.96] font-semibold tracking-[-0.06em] text-balance">
                A durable frontend baseline for the next BusinessControl
                dashboard.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg leading-8">
                The product logic will come later. The repository now starts
                with a coherent system for UI primitives, layout patterns,
                quality gates and release automation.
              </p>
            </div>
            <div className={layout.cluster}>
              <Button size="lg">
                Start building features
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline">
                Review project conventions
              </Button>
            </div>
          </div>

          <SurfaceCard className="from-card via-card to-muted/70 flex flex-col justify-between gap-6 bg-gradient-to-br">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm font-medium">
                Foundation status
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {tokenPreview.map((token) => (
                  <div
                    key={token.label}
                    className="border-border/70 bg-background/80 rounded-[var(--radius-md)] border p-4"
                  >
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                      {token.label}
                    </p>
                    <p className="text-foreground mt-2 text-xl font-semibold tracking-[-0.04em]">
                      {token.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-primary/15 bg-primary/8 rounded-[var(--radius-md)] border p-5">
              <p className="text-foreground text-sm font-semibold">
                Ready for future dashboard work
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                Features can now be added without rebuilding project rules,
                tokens, page scaffolding or delivery workflows.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className={layout.sectionMuted}>
        <SectionHeading
          eyebrow="Foundation"
          title="What is already in place"
          description="The baseline stays intentionally lean, but every piece is chosen to support a B2B dashboard that will grow feature by feature."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {foundationAreas.map(({ description, icon: Icon, title }) => (
            <SurfaceCard key={title} className="h-full">
              <div className="space-y-4">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-[var(--radius-md)]">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-foreground text-xl font-semibold tracking-[-0.04em]">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-7">
                    {description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className={layout.section}>
        <SectionHeading
          eyebrow="Architecture"
          title="Project conventions"
          description="The structure is tuned for maintainability and incremental delivery rather than an early heavy abstraction layer."
        />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm font-semibold tracking-[0.16em] uppercase">
                Repository map
              </p>
              <div className="space-y-3">
                {architectureAreas.map((item) => (
                  <div
                    key={item}
                    className="border-border/60 bg-background/85 flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3"
                  >
                    <CheckCircle2 className="text-primary mt-0.5 size-4" />
                    <p className="text-foreground text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="from-muted/70 to-card bg-gradient-to-b">
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm font-semibold tracking-[0.16em] uppercase">
                Next additions
              </p>
              <div className="text-muted-foreground space-y-3 text-sm leading-7">
                <p>
                  Add feature slices under `src/features` when product logic
                  starts.
                </p>
                <p>
                  Keep pages thin and compose from `components/shared` plus
                  feature modules.
                </p>
                <p>
                  Extend shadcn primitives only when the abstraction pays for
                  itself.
                </p>
                <p>
                  Route data fetching and server actions by business intent, not
                  by UI component.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PageShell>
  );
}
