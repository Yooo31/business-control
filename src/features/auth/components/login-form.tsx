"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { queueAuthSuccessToast } from "@/components/providers/auth-feedback-listener";
import { Button } from "@/components/ui/button";
import { FormField } from "@/features/auth/components/form-field";
import { DEFAULT_AUTH_REDIRECT } from "@/features/auth/constants";
import {
  validateEmailField,
  validateLoginInput,
  validatePasswordField,
} from "@/features/auth/validation";

function mapAuthError(error: string | undefined) {
  if (error === "CredentialsSignin") {
    return "Invalid email or password.";
  }

  return "Unable to sign in right now. Please try again.";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<"email" | "password", string>>
  >({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? DEFAULT_AUTH_REDIRECT,
    [searchParams],
  );

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const validation = validateLoginInput({
          email,
          password,
        });

        setClientErrors(validation.errors);

        if (!validation.isValid) {
          return;
        }

        startTransition(async () => {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
          });

          if (!result?.ok) {
            toast.error(mapAuthError(result?.error ?? undefined));
            return;
          }

          queueAuthSuccessToast("Signed in successfully.");
          window.location.assign(result.url ?? callbackUrl);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={clientErrors.email}
          onBlur={(event) => {
            const nextEmail = event.currentTarget.value;
            const nextEmailError = validateEmailField(nextEmail);

            setClientErrors((currentErrors) => {
              if (nextEmailError) {
                return {
                  ...currentErrors,
                  email: nextEmailError,
                };
              }

              const { email: _omitted, ...rest } = currentErrors;

              return rest;
            });
          }}
          onChange={(event) => {
            const nextEmail = event.currentTarget.value;
            const nextEmailError = validateEmailField(nextEmail);

            setEmail(nextEmail);
            setClientErrors((currentErrors) => {
              if (nextEmailError) {
                return {
                  ...currentErrors,
                  email: nextEmailError,
                };
              }

              const { email: _omitted, ...rest } = currentErrors;

              return rest;
            });
          }}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          error={clientErrors.password}
          onBlur={(event) => {
            const nextPassword = event.currentTarget.value;
            const nextPasswordError = validatePasswordField(nextPassword);

            setClientErrors((currentErrors) => {
              if (nextPasswordError) {
                return {
                  ...currentErrors,
                  password: nextPasswordError,
                };
              }

              const { password: _omitted, ...rest } = currentErrors;

              return rest;
            });
          }}
          onChange={(event) => {
            const nextPassword = event.currentTarget.value;
            const nextPasswordError = validatePasswordField(nextPassword);

            setPassword(nextPassword);
            setClientErrors((currentErrors) => {
              if (nextPasswordError) {
                return {
                  ...currentErrors,
                  password: nextPasswordError,
                };
              }

              const { password: _omitted, ...rest } = currentErrors;

              return rest;
            });
          }}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-muted-foreground text-sm">
        Need an account?{" "}
        <a
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Create one
        </a>
      </p>
    </form>
  );
}
