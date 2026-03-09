"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/features/auth/components/form-field";
import {
  type CompanyFormInput,
  companyFormSchema,
  validateCompanyField,
} from "@/features/onboarding/company-form";
import {
  type CompanyLookupResult,
  isValidSiren,
  isValidSiret,
  normalizeIdentifier,
} from "@/features/onboarding/company-lookup";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "business-control:onboarding-draft";

const steps = [
  {
    id: "identifiers",
    label: "SIREN / SIRET",
    description: "Optionnel. Utilisez la recherche pour pre-remplir les champs.",
  },
  {
    id: "company",
    label: "Informations entreprise",
    description: "Construisez la source de verite editable avant sauvegarde.",
  },
  {
    id: "summary",
    label: "Resume",
    description: "Revoyez, modifiez ou supprimez avant de terminer.",
  },
] as const;

type OnboardingCompany = {
  id?: string;
  siren: string;
  siret: string;
  companyName: string;
  legalName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  activity: string;
  website: string;
};

type OnboardingCompanyField = Exclude<keyof OnboardingCompany, "id">;

type OnboardingDraft = {
  currentStep: number;
  currentCompany: OnboardingCompany;
};

type OnboardingWizardProps = {
  initialCompanies: OnboardingCompany[];
  isOnboardingCompleted: boolean;
  userName: string | null;
};

const emptyCompanyDraft: OnboardingCompany = {
  siren: "",
  siret: "",
  companyName: "",
  legalName: "",
  addressLine: "",
  postalCode: "",
  city: "",
  phone: "",
  email: "",
  activity: "",
  website: "",
};

const initialDraft: OnboardingDraft = {
  currentStep: 0,
  currentCompany: emptyCompanyDraft,
};

const requiredCompanyFields: OnboardingCompanyField[] = [
  "companyName",
  "addressLine",
  "phone",
  "email",
  "website",
];

const requiredCompanyFieldLabels: Record<OnboardingCompanyField, string> = {
  companyName: "denomination",
  addressLine: "adresse",
  phone: "telephone",
  email: "email",
  website: "site web",
  legalName: "",
  siren: "",
  siret: "",
  postalCode: "",
  city: "",
  activity: "",
};

const companyFieldLabels: Partial<Record<OnboardingCompanyField, string>> = {
  siren: "SIREN",
  siret: "SIRET",
  companyName: "Denomination",
  legalName: "Raison sociale",
  addressLine: "Adresse",
  postalCode: "Code postal",
  city: "Ville",
  phone: "Telephone",
  email: "Email",
  activity: "Activite",
  website: "Site web",
};

function isValidStepIndex(value: number) {
  return value >= 0 && value < steps.length;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sanitizeCompany(value: unknown): OnboardingCompany {
  if (!isObject(value)) {
    return emptyCompanyDraft;
  }

  const id = readString(value.id);

  return {
    siren: readString(value.siren),
    siret: readString(value.siret),
    companyName: readString(value.companyName),
    legalName: readString(value.legalName),
    addressLine: readString(value.addressLine),
    postalCode: readString(value.postalCode),
    city: readString(value.city),
    phone: readString(value.phone),
    email: readString(value.email),
    activity: readString(value.activity),
    website: readString(value.website),
    ...(id ? { id } : {}),
  };
}

function sanitizeDraft(value: unknown): OnboardingDraft {
  if (!isObject(value)) {
    return initialDraft;
  }

  return {
    currentStep:
      typeof value.currentStep === "number" && isValidStepIndex(value.currentStep)
        ? value.currentStep
        : 0,
    currentCompany: sanitizeCompany(value.currentCompany),
  };
}

function hasCompanyDraftValues(company: OnboardingCompany) {
  return (
    company.siren !== "" ||
    company.siret !== "" ||
    company.companyName !== "" ||
    company.legalName !== "" ||
    company.addressLine !== "" ||
    company.postalCode !== "" ||
    company.city !== "" ||
    company.phone !== "" ||
    company.email !== "" ||
    company.activity !== "" ||
    company.website !== ""
  );
}

export function OnboardingWizard({
  initialCompanies,
  isOnboardingCompleted,
  userName,
}: OnboardingWizardProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [savedCompanies, setSavedCompanies] = useState(initialCompanies);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isLookupPending, setIsLookupPending] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isDeletingCompanyId, setIsDeletingCompanyId] = useState("");
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<OnboardingCompanyField, string>>
  >({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedDraft = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (storedDraft) {
        try {
          setDraft(sanitizeDraft(JSON.parse(storedDraft)));
        } catch {
          window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        }
      }

      setHasLoadedDraft(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft) {
      return;
    }

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hasLoadedDraft]);

  useEffect(() => {
    setSavedCompanies(initialCompanies);
  }, [initialCompanies]);

  const currentStep = steps[draft.currentStep] ?? steps[0];
  const canGoBack = draft.currentStep > 0;
  const isEditingExistingCompany = typeof draft.currentCompany.id === "string";
  const hasCurrentDraft = hasCompanyDraftValues(draft.currentCompany);
  const visibleFieldErrors = Object.entries(fieldErrors).filter(
    ([, message]) => typeof message === "string" && message !== "",
  );
  const sirenError =
    draft.currentCompany.siren !== "" && !isValidSiren(draft.currentCompany.siren)
      ? "Le SIREN doit contenir 9 chiffres valides."
      : "";
  const siretError =
    draft.currentCompany.siret !== "" && !isValidSiret(draft.currentCompany.siret)
      ? "Le SIRET doit contenir 14 chiffres valides."
      : "";
  const canRunLookup =
    (draft.currentCompany.siren !== "" && isValidSiren(draft.currentCompany.siren)) ||
    (draft.currentCompany.siret !== "" && isValidSiret(draft.currentCompany.siret));

  function setSingleFieldError(field: OnboardingCompanyField, message: string) {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: message,
    }));
  }

  function resetMessages() {
    setLookupMessage("");
    setLookupError("");
    setSaveError("");
  }

  function resetCurrentCompany(nextStep = 0) {
    setFieldErrors({});
    resetMessages();
    setDraft({
      currentStep: nextStep,
      currentCompany: emptyCompanyDraft,
    });
  }

  function buildClientFieldErrors() {
    const parsedDraft = companyFormSchema.safeParse(
      draft.currentCompany satisfies CompanyFormInput,
    );

    if (parsedDraft.success) {
      return null;
    }

    const nextFieldErrors: Partial<Record<OnboardingCompanyField, string>> = {};

    for (const issue of parsedDraft.error.issues) {
      const field = issue.path[0];

      if (typeof field === "string" && !(field in nextFieldErrors)) {
        nextFieldErrors[field as OnboardingCompanyField] = issue.message;
      }
    }

    return nextFieldErrors;
  }

  function updateCompanyField(field: OnboardingCompanyField, value: string) {
    if (field === "siren" || field === "siret") {
      setLookupMessage("");
      setLookupError("");
    }

    setFieldErrors((currentErrors) =>
      Object.fromEntries(
        Object.entries(currentErrors).filter(([currentField]) => currentField !== field),
      ) as Partial<Record<OnboardingCompanyField, string>>,
    );
    setSaveError("");

    setDraft((currentDraft) => ({
      ...currentDraft,
      currentCompany: {
        ...currentDraft.currentCompany,
        [field]: value,
      },
    }));
  }

  function validateFieldOnBlur(field: OnboardingCompanyField) {
    setSingleFieldError(field, validateCompanyField(field, draft.currentCompany[field]));
  }

  function goToStep(stepIndex: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: stepIndex,
    }));
  }

  function goToPreviousStep() {
    if (!canGoBack) {
      return;
    }

    goToStep(draft.currentStep - 1);
  }

  function goToNextStep() {
    if (draft.currentStep >= steps.length - 1) {
      return;
    }

    goToStep(draft.currentStep + 1);
  }

  function clearDraftStorage() {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }

  function applyLookupResult(company: CompanyLookupResult) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      currentCompany: {
        ...currentDraft.currentCompany,
        siren: company.siren || currentDraft.currentCompany.siren,
        siret: company.siret || currentDraft.currentCompany.siret,
        companyName: company.companyName || currentDraft.currentCompany.companyName,
        legalName: company.legalName || currentDraft.currentCompany.legalName,
        addressLine: company.addressLine || currentDraft.currentCompany.addressLine,
        postalCode: company.postalCode || currentDraft.currentCompany.postalCode,
        city: company.city || currentDraft.currentCompany.city,
        phone: company.phone || currentDraft.currentCompany.phone,
        activity: company.activity || currentDraft.currentCompany.activity,
      },
    }));
  }

  async function completeOnboarding(clearDraft = false) {
    setIsCompletingOnboarding(true);
    setSaveError("");

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setSaveError(payload.message ?? "Impossible de finaliser l'onboarding.");
        return;
      }

      if (clearDraft) {
        clearDraftStorage();
      }

      window.location.assign(payload.redirectTo ?? "/dashboard");
    } catch {
      setSaveError("Impossible de finaliser l'onboarding.");
    } finally {
      setIsCompletingOnboarding(false);
    }
  }

  async function saveCurrentCompany(completeAfterSave: boolean) {
    setFieldErrors({});
    setSaveError("");
    setIsSavingCompany(true);

    try {
      const clientFieldErrors = buildClientFieldErrors();

      if (clientFieldErrors) {
        setFieldErrors(clientFieldErrors);
        setSaveError("Completer les champs requis avant de continuer.");
        goToStep(1);
        return;
      }

      const response = await fetch("/api/onboarding/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: draft.currentCompany.id,
          company: draft.currentCompany satisfies CompanyFormInput,
        }),
      });
      const payload = (await response.json()) as {
        company?: OnboardingCompany;
        fieldErrors?: Partial<Record<OnboardingCompanyField, string>>;
        message?: string;
      };

      if (response.status === 422 && payload.fieldErrors) {
        setFieldErrors(payload.fieldErrors);
        setSaveError(payload.message ?? "Veuillez corriger les champs requis.");
        goToStep(1);
        return;
      }

      if (!response.ok || !payload.company) {
        setSaveError(
          payload.message ??
            "Impossible d'enregistrer l'entreprise pour le moment.",
        );
        return;
      }

      const savedCompany = payload.company;

      setSavedCompanies((currentCompanies) => {
        const existingIndex = currentCompanies.findIndex(
          (company) => company.id === savedCompany.id,
        );

        if (existingIndex === -1) {
          return [...currentCompanies, savedCompany];
        }

        return currentCompanies.map((company) =>
          company.id === savedCompany.id ? savedCompany : company,
        );
      });
      resetCurrentCompany(2);

      if (completeAfterSave) {
        clearDraftStorage();
        await completeOnboarding(false);
      }
    } catch {
      setSaveError("Impossible d'enregistrer l'entreprise pour le moment.");
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function deleteCompany(companyId: string) {
    setIsDeletingCompanyId(companyId);
    setSaveError("");

    try {
      const response = await fetch(`/api/onboarding/company/${companyId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setSaveError(
          payload.message ?? "Impossible de supprimer l'entreprise pour le moment.",
        );
        return;
      }

      setSavedCompanies((currentCompanies) =>
        currentCompanies.filter((company) => company.id !== companyId),
      );

      if (draft.currentCompany.id === companyId) {
        resetCurrentCompany(2);
      }
    } catch {
      setSaveError("Impossible de supprimer l'entreprise pour le moment.");
    } finally {
      setIsDeletingCompanyId("");
    }
  }

  function editCompany(company: OnboardingCompany) {
    setFieldErrors({});
    resetMessages();
    setDraft({
      currentStep: 1,
      currentCompany: company,
    });
  }

  function startAnotherCompany() {
    resetCurrentCompany(0);
  }

  async function handleFinish() {
    if (hasCurrentDraft) {
      await saveCurrentCompany(true);
      return;
    }

    await completeOnboarding(true);
  }

  async function handleSkip() {
    clearDraftStorage();
    await completeOnboarding(false);
  }

  async function handlePrimarySummaryAction() {
    if (hasCurrentDraft) {
      await saveCurrentCompany(false);
      return;
    }

    startAnotherCompany();
  }

  async function runCompanyLookup() {
    const siren = normalizeIdentifier(draft.currentCompany.siren);
    const siret = normalizeIdentifier(draft.currentCompany.siret);

    setDraft((currentDraft) => ({
      ...currentDraft,
      currentCompany: {
        ...currentDraft.currentCompany,
        siren,
        siret,
      },
    }));
    setLookupMessage("");
    setLookupError("");

    if (!canRunLookup) {
      setLookupError(
        "Renseignez un SIREN ou un SIRET valide pour lancer la recherche automatique.",
      );
      return;
    }

    setIsLookupPending(true);

    try {
      const searchParams = new URLSearchParams();

      if (siren !== "") {
        searchParams.set("siren", siren);
      }

      if (siret !== "") {
        searchParams.set("siret", siret);
      }

      const response = await fetch(`/api/insee/company?${searchParams.toString()}`, {
        method: "GET",
      });
      const payload = (await response.json()) as {
        company?: CompanyLookupResult;
        message?: string;
      };

      if (!response.ok || !payload.company) {
        setLookupError(
          payload.message ??
            "La recherche n'a pas abouti. Vous pouvez continuer manuellement.",
        );
        return;
      }

      applyLookupResult(payload.company);
      setLookupMessage("Entreprise trouvee. Les champs ont ete pre-remplis.");
    } catch {
      setLookupError(
        "La recherche gouvernementale est indisponible. Vous pouvez continuer manuellement.",
      );
    } finally {
      setIsLookupPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-card/90 shadow-[var(--shadow-md)] backdrop-blur">
        <div className="border-b border-border/70 bg-linear-to-r from-primary/8 via-background to-background px-8 py-8 sm:px-10">
          <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
            {isOnboardingCompleted ? "Company setup" : "Onboarding"}
          </p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                {isOnboardingCompleted
                  ? "Manage your companies"
                  : "Configure your first companies"}
                {userName ? `, ${userName}` : ""}.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-7">
                SIREN and SIRET are optional helpers. You can skip them, create
                one or more companies, and return later if needed.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/80 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                Entreprises liees
              </p>
              <p className="mt-2 text-2xl font-semibold">{savedCompanies.length}</p>
              <p className="text-muted-foreground text-sm">
                compte{savedCompanies.length > 1 ? "s" : ""} source de verite
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-8 py-8 sm:px-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <ol className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === draft.currentStep;
              const isComplete = index < draft.currentStep;

              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-[var(--radius-lg)] border px-4 py-4 transition",
                    isActive
                      ? "border-primary/40 bg-primary/8"
                      : "border-border/70 bg-background/70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        isComplete || isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className="text-muted-foreground text-sm leading-6">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                Step {draft.currentStep + 1}
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {currentStep.label}
              </h2>
              <p className="text-muted-foreground text-base leading-7">
                {currentStep.description}
              </p>
            </div>

            {draft.currentStep === 0 ? (
              <div className="space-y-4">
                <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-4">
                  <p className="text-sm font-semibold">Aide facultative</p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    Cette etape n&apos;est pas obligatoire. Vous pouvez passer a
                    la saisie manuelle si vous n&apos;avez pas encore les
                    identifiants.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="SIREN"
                    name="siren"
                    value={draft.currentCompany.siren}
                    error={sirenError}
                    onBlur={() => {
                      if (draft.currentCompany.siren !== "") {
                        validateFieldOnBlur("siren");
                      }
                    }}
                    onChange={(event) => {
                      updateCompanyField(
                        "siren",
                        normalizeIdentifier(event.currentTarget.value).slice(0, 9),
                      );
                    }}
                  />
                  <FormField
                    label="SIRET"
                    name="siret"
                    value={draft.currentCompany.siret}
                    error={siretError}
                    onBlur={() => {
                      if (draft.currentCompany.siret !== "") {
                        validateFieldOnBlur("siret");
                      }
                    }}
                    onChange={(event) => {
                      updateCompanyField(
                        "siret",
                        normalizeIdentifier(event.currentTarget.value).slice(0, 14),
                      );
                    }}
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Recherche automatique via l&apos;API Sirene
                    </p>
                    <p className="text-muted-foreground text-sm leading-6">
                      Lancez la recherche uniquement si vous avez un identifiant
                      valide. Sinon, passez directement a l&apos;etape suivante.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    disabled={isLookupPending}
                    onClick={() => {
                      void runCompanyLookup();
                    }}
                  >
                    {isLookupPending ? "Recherche..." : "Rechercher"}
                  </Button>
                </div>

                {lookupMessage ? (
                  <p className="rounded-[var(--radius-md)] border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground">
                    {lookupMessage}
                  </p>
                ) : null}

                {lookupError ? (
                  <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-foreground">
                    {lookupError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {draft.currentStep === 1 ? (
              <div className="space-y-5">
                <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-4">
                  <p className="text-sm font-semibold">
                    {isEditingExistingCompany
                      ? "Edition d'une entreprise existante"
                      : "Source de verite de l'entreprise"}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    Les champs marques d&apos;une etoile sont requis. Les
                    donnees peuvent etre corrigees a tout moment avant la
                    validation finale.
                  </p>
                </div>

                {visibleFieldErrors.length > 0 || saveError ? (
                  <div className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/8 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Verification requise avant enregistrement
                    </p>
                    {saveError ? (
                      <p className="mt-2 text-sm text-foreground">{saveError}</p>
                    ) : null}
                    {visibleFieldErrors.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-foreground">
                        {visibleFieldErrors.map(([field, message]) => (
                          <li key={field}>
                            <span className="font-medium">
                              {companyFieldLabels[field as OnboardingCompanyField] ??
                                field}
                            </span>
                            : {message}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Denomination *"
                    name="companyName"
                    value={draft.currentCompany.companyName}
                    error={fieldErrors.companyName}
                    onBlur={() => {
                      validateFieldOnBlur("companyName");
                    }}
                    onChange={(event) => {
                      updateCompanyField("companyName", event.currentTarget.value);
                    }}
                  />
                  <FormField
                    label="Raison sociale"
                    name="legalName"
                    value={draft.currentCompany.legalName}
                    error={fieldErrors.legalName}
                    onBlur={() => {
                      validateFieldOnBlur("legalName");
                    }}
                    onChange={(event) => {
                      updateCompanyField("legalName", event.currentTarget.value);
                    }}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      label="Adresse *"
                      name="addressLine"
                      value={draft.currentCompany.addressLine}
                      error={fieldErrors.addressLine}
                      onBlur={() => {
                        validateFieldOnBlur("addressLine");
                      }}
                      onChange={(event) => {
                        updateCompanyField("addressLine", event.currentTarget.value);
                      }}
                    />
                  </div>
                  <FormField
                    label="Code postal"
                    name="postalCode"
                    value={draft.currentCompany.postalCode}
                    error={fieldErrors.postalCode}
                    onBlur={() => {
                      validateFieldOnBlur("postalCode");
                    }}
                    onChange={(event) => {
                      updateCompanyField("postalCode", event.currentTarget.value);
                    }}
                  />
                  <FormField
                    label="Ville"
                    name="city"
                    value={draft.currentCompany.city}
                    error={fieldErrors.city}
                    onBlur={() => {
                      validateFieldOnBlur("city");
                    }}
                    onChange={(event) => {
                      updateCompanyField("city", event.currentTarget.value);
                    }}
                  />
                  <FormField
                    label="Telephone *"
                    name="phone"
                    value={draft.currentCompany.phone}
                    error={fieldErrors.phone}
                    onBlur={() => {
                      validateFieldOnBlur("phone");
                    }}
                    onChange={(event) => {
                      updateCompanyField("phone", event.currentTarget.value);
                    }}
                  />
                  <FormField
                    label="Email *"
                    name="email"
                    type="email"
                    value={draft.currentCompany.email}
                    error={fieldErrors.email}
                    onBlur={() => {
                      validateFieldOnBlur("email");
                    }}
                    onChange={(event) => {
                      updateCompanyField("email", event.currentTarget.value);
                    }}
                  />
                  <FormField
                    label="Activite"
                    name="activity"
                    value={draft.currentCompany.activity}
                    error={fieldErrors.activity}
                    onBlur={() => {
                      validateFieldOnBlur("activity");
                    }}
                    onChange={(event) => {
                      updateCompanyField("activity", event.currentTarget.value);
                    }}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      label="Site web *"
                      name="website"
                      type="url"
                      value={draft.currentCompany.website}
                      error={fieldErrors.website}
                      onBlur={() => {
                        validateFieldOnBlur("website");
                      }}
                      onChange={(event) => {
                        updateCompanyField("website", event.currentTarget.value);
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2 rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-4 text-sm">
                  <p className="font-semibold">Champs requis</p>
                  <p className="text-muted-foreground leading-6">
                    {requiredCompanyFields
                      .map((field) => requiredCompanyFieldLabels[field])
                      .join(", ")}
                  </p>
                </div>
              </div>
            ) : null}

            {draft.currentStep === 2 ? (
              <div className="space-y-6">
                {hasCurrentDraft ? (
                  <div className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary/6 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">Entreprise en cours</p>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          Cette entreprise n&apos;est pas encore enregistree.
                          Vous pouvez revenir pour corriger ou l&apos;enregistrer
                          directement depuis cet ecran.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          goToStep(1);
                        }}
                      >
                        Modifier
                      </Button>
                    </div>
                    <dl className="text-muted-foreground mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                      <div>
                        <dt className="font-medium text-foreground">Denomination</dt>
                        <dd>{draft.currentCompany.companyName || "Non renseigne"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-foreground">Email</dt>
                        <dd>{draft.currentCompany.email || "Non renseigne"}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="font-medium text-foreground">Adresse</dt>
                        <dd>{draft.currentCompany.addressLine || "Non renseigne"}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}

                <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-5">
                  <p className="text-sm font-semibold">Entreprises ajoutees</p>
                  {savedCompanies.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {savedCompanies.map((company) => (
                        <li
                          key={company.id ?? company.companyName}
                          className="rounded-[var(--radius-md)] border border-border/60 px-4 py-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {company.companyName || company.legalName || "Entreprise"}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {company.addressLine || "Adresse manquante"}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {company.email || "Email manquant"} ·{" "}
                                {company.website || "Site web manquant"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  editCompany(company);
                                }}
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                disabled={isDeletingCompanyId === company.id}
                                onClick={() => {
                                  if (company.id) {
                                    void deleteCompany(company.id);
                                  }
                                }}
                              >
                                {isDeletingCompanyId === company.id
                                  ? "Suppression..."
                                  : "Supprimer"}
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Aucune entreprise enregistree pour l&apos;instant.
                    </div>
                  )}
                </div>

                {saveError ? (
                  <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-foreground">
                    {saveError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    size="lg"
                    disabled={isSavingCompany || isCompletingOnboarding}
                    onClick={() => {
                      void handlePrimarySummaryAction();
                    }}
                  >
                    {hasCurrentDraft
                      ? isEditingExistingCompany
                        ? "Enregistrer les modifications"
                        : "Enregistrer et ajouter une autre entreprise"
                      : "Ajouter une autre entreprise"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    disabled={isSavingCompany || isCompletingOnboarding}
                    onClick={() => {
                      void handleFinish();
                    }}
                  >
                    {isSavingCompany || isCompletingOnboarding
                      ? "Traitement..."
                      : hasCurrentDraft
                        ? "Enregistrer et terminer"
                        : "Terminer"}
                  </Button>
                  {!isOnboardingCompleted ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="ghost"
                      disabled={isCompletingOnboarding}
                      onClick={() => {
                        void handleSkip();
                      }}
                    >
                      Passer pour l&apos;instant
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Le brouillon local conserve uniquement l&apos;entreprise en cours
                de saisie. Les entreprises enregistrees sont liees a votre
                compte.
              </p>
              {draft.currentStep < 2 ? (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={!canGoBack}
                    onClick={goToPreviousStep}
                  >
                    Precedent
                  </Button>
                  <Button type="button" size="lg" onClick={goToNextStep}>
                    Suivant
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={goToPreviousStep}
                >
                  Revenir au formulaire
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
