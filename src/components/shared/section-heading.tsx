import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  description: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  title,
  description,
  eyebrow,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h2 className="text-foreground text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.05em]">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl text-base leading-7">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="sm:self-center">{action}</div> : null}
    </div>
  );
}
