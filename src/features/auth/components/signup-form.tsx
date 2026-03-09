"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { queueAuthSuccessToast } from "@/components/providers/auth-feedback-listener";
import { Button } from "@/components/ui/button";
import { signupAction } from "@/features/auth/actions";
import { FormField } from "@/features/auth/components/form-field";
import { DEFAULT_AUTH_REDIRECT } from "@/features/auth/constants";
import { initialSignupActionState } from "@/features/auth/state";
import { validateSignupInput } from "@/features/auth/validation";
import { cn } from "@/lib/utils";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

type SignupClientErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

function withFieldError(
  currentErrors: SignupClientErrors,
  field: keyof SignupClientErrors,
  message: string | null,
) {
  if (message) {
    return {
      ...currentErrors,
      [field]: message,
    };
  }

  if (field === "name") {
    const { name: _omitted, ...rest } = currentErrors;

    return rest;
  }

  if (field === "email") {
    const { email: _omitted, ...rest } = currentErrors;

    return rest;
  }

  if (field === "password") {
    const { password: _omitted, ...rest } = currentErrors;

    return rest;
  }

  const { confirmPassword: _omitted, ...rest } = currentErrors;

  return rest;
}

export function SignupForm() {
  const [serverState, formAction, pending] = useActionState(
    signupAction,
    initialSignupActionState,
  );
  const [clientErrors, setClientErrors] = useState<SignupClientErrors>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSigningIn, startSigningIn] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? DEFAULT_AUTH_REDIRECT,
    [searchParams],
  );

  useEffect(() => {
    if (serverState.status === "error" && serverState.message) {
      toast.error(serverState.message);
    }

    if (serverState.status !== "success" || !serverState.submittedEmail) {
      return;
    }

    startSigningIn(async () => {
      const result = await signIn("credentials", {
        email: serverState.submittedEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        toast.error("Account created, but automatic sign-in failed.");
        return;
      }

      queueAuthSuccessToast("Signed in successfully.");
      window.location.assign(result.url ?? callbackUrl);
      router.refresh();
    });
  }, [callbackUrl, password, router, serverState]);

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const validation = validateSignupInput({
          name: readFormValue(formData, "name"),
          email: readFormValue(formData, "email"),
          password: readFormValue(formData, "password"),
          confirmPassword: readFormValue(formData, "confirmPassword"),
        });

        setClientErrors(validation.errors);

        if (!validation.isValid) {
          event.preventDefault();
        }
      }}
    >
      <div className="grid gap-4">
        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          required
          error={clientErrors.name ?? serverState.fieldErrors?.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={serverState.submittedEmail}
          required
          error={clientErrors.email ?? serverState.fieldErrors?.email}
        />
        <label className="space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={cn(
              "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 flex h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm shadow-xs outline-none transition focus-visible:ring-4",
              clientErrors.password ?? serverState.fieldErrors?.password
                ? "border-destructive/60 focus-visible:ring-destructive/20"
                : "",
            )}
            onChange={(event) => {
              const nextPassword = event.currentTarget.value;

              setPassword(nextPassword);
              setClientErrors((currentErrors) => {
                const withPasswordError = withFieldError(
                  currentErrors,
                  "password",
                  nextPassword.length >= 8 || nextPassword.length === 0
                    ? null
                    : "Password must be at least 8 characters.",
                );

                return withFieldError(
                  withPasswordError,
                  "confirmPassword",
                  confirmPassword && nextPassword !== confirmPassword
                    ? "Passwords do not match."
                    : null,
                );
              });
            }}
          />
          {clientErrors.password ?? serverState.fieldErrors?.password ? (
            <p className="text-destructive text-sm">
              {clientErrors.password ?? serverState.fieldErrors?.password}
            </p>
          ) : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={cn(
              "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 flex h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm shadow-xs outline-none transition focus-visible:ring-4",
              clientErrors.confirmPassword ?? serverState.fieldErrors?.confirmPassword
                ? "border-destructive/60 focus-visible:ring-destructive/20"
                : "",
            )}
            onChange={(event) => {
              const nextConfirmPassword = event.currentTarget.value;

              setConfirmPassword(nextConfirmPassword);
              setClientErrors((currentErrors) =>
                withFieldError(
                  currentErrors,
                  "confirmPassword",
                  password !== nextConfirmPassword
                    ? "Passwords do not match."
                    : null,
                ),
              );
            }}
          />
          {clientErrors.confirmPassword ?? serverState.fieldErrors?.confirmPassword ? (
            <p className="text-destructive text-sm">
              {clientErrors.confirmPassword ?? serverState.fieldErrors?.confirmPassword}
            </p>
          ) : null}
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || isSigningIn}
      >
        {pending || isSigningIn ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-muted-foreground text-sm">
        Already have an account?{" "}
        <a
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
