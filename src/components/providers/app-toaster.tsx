"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className:
          "border border-border/70 bg-card text-foreground shadow-[var(--shadow-md)]",
        success: {
          iconTheme: {
            primary: "#198754",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#d9485f",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
