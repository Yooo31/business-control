import type { FieldErrors } from "@/features/auth/validation";

export type SignupActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors<"name" | "email" | "password" | "confirmPassword">;
  submittedEmail?: string;
};

export const initialSignupActionState: SignupActionState = {
  status: "idle",
};
