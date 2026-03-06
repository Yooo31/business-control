import type { ReactNode } from "react";

import { layout } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return <main className={cn(layout.page, className)}>{children}</main>;
}
