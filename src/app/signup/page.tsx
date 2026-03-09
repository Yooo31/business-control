import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Register with your email and password, then get signed in automatically."
      footer={
        <span>
          Passwords are hashed with bcrypt before being stored in Prisma.
        </span>
      }
    >
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
