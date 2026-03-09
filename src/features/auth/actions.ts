"use server";

import type { SignupActionState } from "@/features/auth/state";
import {
  normalizeEmail,
  validateSignupInput,
} from "@/features/auth/validation";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function signupAction(
  _previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const name = readFormValue(formData, "name").trim();
  const email = normalizeEmail(readFormValue(formData, "email"));
  const password = readFormValue(formData, "password");
  const confirmPassword = readFormValue(formData, "confirmPassword");
  const validation = validateSignupInput({
    name,
    email,
    password,
    confirmPassword,
  });

  if (!validation.isValid) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: validation.errors,
      submittedEmail: email,
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "An account already exists for this email.",
      fieldErrors: {
        email: "This email is already in use.",
      },
      submittedEmail: email,
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  });

  return {
    status: "success",
    message: "Account created successfully.",
    submittedEmail: email,
  };
}
