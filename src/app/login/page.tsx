import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to your workspace"
      description="Use the credentials provider backed by NextAuth, Prisma and Supabase."
      footer={
        <span>
          Protected routes redirect here automatically when there is no active
          session.
        </span>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
