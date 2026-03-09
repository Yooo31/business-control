const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

export type FieldErrors<TField extends string> = Partial<
  Record<TField, string>
>;

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = LoginInput & {
  name: string;
  confirmPassword: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmailField(email: string) {
  if (!email) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePasswordField(password: string) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters.`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${String(MAX_PASSWORD_LENGTH)} characters.`;
  }

  return null;
}

export function validateLoginInput(values: LoginInput) {
  const errors: FieldErrors<keyof LoginInput> = {};
  const emailError = validateEmailField(normalizeEmail(values.email));
  const passwordError = validatePasswordField(values.password);

  if (emailError) {
    errors.email = emailError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function validateSignupInput(values: SignupInput) {
  const errors: FieldErrors<keyof SignupInput> = {
    ...validateLoginInput(values).errors,
  };

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
