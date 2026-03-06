export const layout = {
  page: "mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-8 px-6 py-6 sm:px-8 lg:px-10",
  section:
    "rounded-[var(--radius-xl)] border border-border/80 bg-card/88 p-6 shadow-[var(--shadow-sm)] backdrop-blur sm:p-8",
  sectionMuted:
    "rounded-[var(--radius-xl)] border border-border/70 bg-muted/55 p-6 shadow-[var(--shadow-sm)] backdrop-blur sm:p-8",
  contentGrid: "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]",
  stack: "flex flex-col gap-6",
  cluster: "flex flex-wrap items-center gap-3",
  dashboardGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
} as const;
