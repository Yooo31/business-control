import "./globals.css";

import type { Metadata } from "next";

import { AppToaster } from "@/components/providers/app-toaster";
import { AuthFeedbackListener } from "@/components/providers/auth-feedback-listener";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={siteConfig.locale} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <AuthSessionProvider>
          {children}
          <AuthFeedbackListener />
          <AppToaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
