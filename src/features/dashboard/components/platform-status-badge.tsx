import type { PlatformListingStatus, PlatformName } from "@/generated/prisma/client";

import { cn } from "@/lib/utils";

import { platformStatusMap, type StatusDisplay } from "../status-mapping";

type PlatformStatusBadgeProps = {
  platform: PlatformName;
  status: PlatformListingStatus;
  className?: string;
};

const platformLabels: Record<PlatformName, string> = {
  GOOGLE: "Google",
  APPLE: "Apple",
  YELP: "Yelp",
};

const platformIcons: Record<PlatformName, React.ReactNode> = {
  GOOGLE: (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  APPLE: (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  YELP: (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.17-.08-1.17-.588V5.63c0-.658.34-.985.72-1.088.38-.102 5.27-1.44 5.56-1.52.29-.08.69.02.87.41.18.39.13 4.95.13 5.35 0 .4-.08.85-.08 1.31 0 .46.03 1.62-.47 2.03-.5.41-.56.48-.56.48zm-4.51 2.44l5.1 3.04c.78.46.64 1.07.43 1.36-.21.29-3.24 3.93-3.52 4.26-.28.33-.82.57-1.31.13-.49-.44-3.67-4.35-3.92-4.64-.25-.29-.43-.95.23-1.42.66-.47 2.99-2.73 2.99-2.73zm-3.18-1.97c-.28-.53-1.19-.42-1.59-.25-.4.17-5.83 2.93-6.17 3.1-.34.17-.76.73-.5 1.47.26.74 1.65 3.76 1.9 4.35.25.59.85.87 1.43.58.58-.29 5.3-3.47 5.58-3.68.28-.21.82-.64.57-1.33-.25-.69-1.22-4.24-1.22-4.24zm1.72-1.67c.54-.01.87-.56.97-.91.1-.35 1.37-6.46 1.44-6.86.07-.4-.11-.95-.72-1.17-.61-.22-3.92-.95-4.6-1.08-.68-.13-1.2.19-1.29.78-.09.59-.39 6.42-.42 6.77-.03.35.05 1.06.75 1.22.7.16 3.87 1.26 3.87 1.26z" />
    </svg>
  ),
};

const fallbackStatus: StatusDisplay = {
  label: "Non lié",
  tone: "neutral",
  colorClass: "text-muted-foreground",
  bgClass: "bg-muted",
};

export function PlatformStatusBadge({
  platform,
  status,
  className,
}: PlatformStatusBadgeProps) {
  const statusDisplay = platformStatusMap[status] ?? fallbackStatus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        statusDisplay.bgClass,
        statusDisplay.colorClass,
        className,
      )}
    >
      {platformIcons[platform]}
      <span>{platformLabels[platform]}</span>
    </div>
  );
}

type PlatformStatusDotsProps = {
  platforms: Array<{
    platform: PlatformName;
    status: PlatformListingStatus;
  }>;
  className?: string;
};

export function PlatformStatusDots({
  platforms,
  className,
}: PlatformStatusDotsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {platforms.map(({ platform, status }) => {
        const statusDisplay = platformStatusMap[status] ?? fallbackStatus;
        return (
          <div
            key={platform}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
              statusDisplay.bgClass,
              statusDisplay.colorClass,
            )}
            title={`${platformLabels[platform]}: ${statusDisplay.label}`}
          >
            {platformIcons[platform]}
            <span className="sr-only sm:not-sr-only">
              {platformLabels[platform]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
