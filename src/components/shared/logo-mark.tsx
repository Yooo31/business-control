export function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="border-primary/20 bg-primary/10 flex size-11 items-center justify-center rounded-[var(--radius-lg)] border shadow-[var(--shadow-sm)]">
        <div className="grid size-5 grid-cols-2 gap-1">
          <span className="bg-primary rounded-sm" />
          <span className="bg-primary/55 rounded-sm" />
          <span className="bg-primary/55 rounded-sm" />
          <span className="bg-primary rounded-sm" />
        </div>
      </div>
      <div>
        <p className="text-primary text-sm font-semibold tracking-[0.16em] uppercase">
          BusinessControl
        </p>
        <p className="text-muted-foreground text-sm">
          SaaS foundation for local presence operations
        </p>
      </div>
    </div>
  );
}
