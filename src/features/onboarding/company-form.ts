import { z } from "zod";

import { normalizeIdentifier } from "@/features/onboarding/company-lookup";

const phonePattern = /^[+()\d\s.-]{6,}$/;

export const companyFormSchema = z.object({
  siren: z
    .string()
    .transform((value) => normalizeIdentifier(value))
    .refine((value) => value === "" || value.length === 9, {
      message: "Le SIREN doit contenir 9 chiffres.",
    }),
  siret: z
    .string()
    .transform((value) => normalizeIdentifier(value))
    .refine((value) => value === "" || value.length === 14, {
      message: "Le SIRET doit contenir 14 chiffres.",
    }),
  companyName: z.string().trim().min(1, "La denomination est requise."),
  legalName: z.string().trim().optional(),
  addressLine: z.string().trim().min(1, "L'adresse est requise."),
  postalCode: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .min(1, "Le numero de telephone est requis.")
    .regex(phonePattern, "Le numero de telephone est invalide."),
  email: z
    .string()
    .trim()
    .min(1, "L'email est requis.")
    .pipe(z.email("L'email est invalide.")),
  website: z
    .string()
    .trim()
    .min(1, "Le site internet est requis.")
    .pipe(z.url("Le site internet doit etre une URL valide.")),
  activity: z.string().trim().optional(),
});

const companyFormShape = companyFormSchema.shape;

export function validateCompanyField(
  field: keyof typeof companyFormShape,
  value: string,
) {
  const result = companyFormShape[field].safeParse(value);

  if (result.success) {
    return "";
  }

  return result.error.issues[0]?.message ?? "Champ invalide.";
}

export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormValues = z.output<typeof companyFormSchema>;
