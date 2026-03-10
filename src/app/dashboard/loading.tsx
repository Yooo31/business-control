import { PageShell } from "@/components/shared/page-shell";
import { SurfaceCard } from "@/components/shared/surface-card";

export default function DashboardLoading() {
  return (
    <PageShell>
      <SurfaceCard className="animate-pulse space-y-4">
        <div className="h-3 w-32 rounded-full bg-muted" />
        <div className="h-10 w-72 rounded-2xl bg-muted" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-muted" />
      </SurfaceCard>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <SurfaceCard key={String(index)} className="animate-pulse space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-muted" />
            <div className="h-6 w-48 rounded-full bg-muted" />
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-4 w-5/6 rounded-full bg-muted" />
            <div className="h-4 w-3/4 rounded-full bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-full bg-muted" />
              <div className="h-8 w-24 rounded-full bg-muted" />
              <div className="h-8 w-24 rounded-full bg-muted" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted" />
          </SurfaceCard>
        ))}
      </div>
    </PageShell>
  );
}
