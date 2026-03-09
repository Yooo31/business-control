import { completeOnboardingAction } from "@/features/onboarding/actions";
import { requirePendingOnboardingUser } from "@/features/onboarding/lib";

export default async function OnboardingPage() {
  const user = await requirePendingOnboardingUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-8 shadow-[var(--shadow-md)] backdrop-blur sm:p-10">
        <div className="space-y-4">
          <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
            Onboarding
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em]">
            Finish your BusinessControl setup
            {user.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-base leading-7">
            The MVP audits local listings across platforms and highlights gaps
            against your internal data. Complete onboarding once to unlock the
            dashboard.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">1. Connect your data</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Import the source of truth for each location.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">2. Review matching</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Check automatic matches and prepare manual linking where needed.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">3. Start auditing</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Monitor listing discrepancies without pushing any changes online.
            </p>
          </div>
        </div>

        <form action={completeOnboardingAction} className="mt-8">
          <button
            type="submit"
            className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold shadow-xs transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            Complete onboarding
          </button>
        </form>
      </section>
    </main>
  );
}
