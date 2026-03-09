import type { ChangeEventHandler, FocusEventHandler } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  name: string;
  type?: string | undefined;
  autoComplete?: string | undefined;
  defaultValue?: string | undefined;
  value?: string | undefined;
  required?: boolean | undefined;
  minLength?: number | undefined;
  error?: string | undefined;
  onBlur?: FocusEventHandler<HTMLInputElement> | undefined;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
};

export function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  defaultValue,
  value,
  required,
  minLength,
  error,
  onBlur,
  onChange,
}: FormFieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        value={value}
        required={required}
        minLength={minLength}
        onBlur={onBlur}
        onChange={onChange}
        className={cn(
          "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 flex h-11 w-full rounded-[var(--radius-md)] border px-3 text-sm shadow-xs outline-none transition focus-visible:ring-4",
          error ? "border-destructive/60 focus-visible:ring-destructive/20" : "",
        )}
      />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </label>
  );
}
