import { ClientSessionPanel } from "@/features/auth/components/client-session-panel";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireOnboardedUser } from "@/features/onboarding/lib";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <section className="rounded-[var(--radius-xl)] border border-border/70 bg-card/90 p-8 shadow-[var(--shadow-md)] backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                Private dashboard
              </p>
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                Welcome back{user.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-7">
                This page is protected server-side and only renders after a
                valid session exists and onboarding is complete.
              </p>
            </div>
            <SignOutButton />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-card/90 p-5">
            <p className="text-sm font-semibold">Server session</p>
            <dl className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">
              <div>
                <dt className="font-medium text-foreground">User ID</dt>
                <dd>{user.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Name</dt>
                <dd>{user.name ?? "Not set"}</dd>
              </div>
            </dl>
          </div>
          <ClientSessionPanel />
        </section>
      </div>
    </main>
  );
}
