"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/features/auth/components/form-field";
import { completeOnboardingAction } from "@/features/onboarding/actions";
import { cn } from "@/lib/utils";

const ONBOARDING_STORAGE_KEY = "business-control:onboarding-draft";

const steps = [
  {
    id: "identifiers",
    label: "SIREN / SIRET",
    description: "Renseignez les identifiants de l'entreprise.",
  },
  {
    id: "company",
    label: "Informations entreprise",
    description: "Capturez les informations de base pour l'audit.",
  },
  {
    id: "next-action",
    label: "Ajouter ou terminer",
    description: "Choisissez la suite du flow d'onboarding.",
  },
] as const;

type OnboardingDraftCompany = {
  siren: string;
  siret: string;
  companyName: string;
  legalName: string;
  website: string;
};

type OnboardingDraft = {
  currentStep: number;
  currentCompany: OnboardingDraftCompany;
  companies: OnboardingDraftCompany[];
};

const emptyCompanyDraft: OnboardingDraftCompany = {
  siren: "",
  siret: "",
  companyName: "",
  legalName: "",
  website: "",
};

const initialDraft: OnboardingDraft = {
  currentStep: 0,
  currentCompany: emptyCompanyDraft,
  companies: [],
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

function sanitizeCompany(value: unknown): OnboardingDraftCompany {
  if (!isObject(value)) {
    return emptyCompanyDraft;
  }

  return {
    siren: readString(value.siren),
    siret: readString(value.siret),
    companyName: readString(value.companyName),
    legalName: readString(value.legalName),
    website: readString(value.website),
  };
}

function sanitizeDraft(value: unknown): OnboardingDraft {
  if (!isObject(value)) {
    return initialDraft;
  }

  const currentStep =
    typeof value.currentStep === "number" && isValidStepIndex(value.currentStep)
      ? value.currentStep
      : 0;
  const companies = Array.isArray(value.companies)
    ? value.companies.map((company) => sanitizeCompany(company))
    : [];

  return {
    currentStep,
    currentCompany: sanitizeCompany(value.currentCompany),
    companies,
  };
}

type OnboardingWizardProps = {
  userName: string | null;
};

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

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

  const currentStep = steps[draft.currentStep] ?? steps[0];
  const canGoBack = draft.currentStep > 0;
  const identifiersComplete =
    draft.currentCompany.siren.trim() !== "" &&
    draft.currentCompany.siret.trim() !== "";
  const companyInfoComplete = draft.currentCompany.companyName.trim() !== "";
  const canGoNext =
    (draft.currentStep === 0 && identifiersComplete) ||
    (draft.currentStep === 1 && companyInfoComplete);

  function updateCompanyField(
    field: keyof OnboardingDraftCompany,
    value: string,
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      currentCompany: {
        ...currentDraft.currentCompany,
        [field]: value,
      },
    }));
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
    if (!canGoNext) {
      return;
    }

    goToStep(draft.currentStep + 1);
  }

  function addAnotherCompany() {
    setDraft((currentDraft) => ({
      currentStep: 0,
      currentCompany: emptyCompanyDraft,
      companies: [...currentDraft.companies, currentDraft.currentCompany],
    }));
  }

  function clearDraftStorage() {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-card/90 shadow-[var(--shadow-md)] backdrop-blur">
        <div className="border-b border-border/70 bg-linear-to-r from-primary/8 via-background to-background px-8 py-8 sm:px-10">
          <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
            Onboarding
          </p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-[-0.05em]">
                Configure your first companies
                {userName ? `, ${userName}` : ""}.
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-7">
                The MVP only audits public listings. Start by defining the
                internal company data that will be compared against online
                platforms.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/80 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                Brouillon
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {draft.companies.length}
              </p>
              <p className="text-muted-foreground text-sm">
                entreprise{draft.companies.length > 1 ? "s" : ""} ajoutee
                {draft.companies.length > 1 ? "s" : ""}
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="SIREN"
                  name="siren"
                  value={draft.currentCompany.siren}
                  onChange={(event) => {
                    updateCompanyField("siren", event.currentTarget.value);
                  }}
                />
                <FormField
                  label="SIRET"
                  name="siret"
                  value={draft.currentCompany.siret}
                  onChange={(event) => {
                    updateCompanyField("siret", event.currentTarget.value);
                  }}
                />
              </div>
            ) : null}

            {draft.currentStep === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Nom commercial"
                  name="companyName"
                  value={draft.currentCompany.companyName}
                  onChange={(event) => {
                    updateCompanyField("companyName", event.currentTarget.value);
                  }}
                />
                <FormField
                  label="Raison sociale"
                  name="legalName"
                  value={draft.currentCompany.legalName}
                  onChange={(event) => {
                    updateCompanyField("legalName", event.currentTarget.value);
                  }}
                />
                <div className="md:col-span-2">
                  <FormField
                    label="Site web"
                    name="website"
                    type="url"
                    value={draft.currentCompany.website}
                    onChange={(event) => {
                      updateCompanyField("website", event.currentTarget.value);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {draft.currentStep === 2 ? (
              <div className="space-y-6">
                <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-5">
                  <p className="text-sm font-semibold">Entreprise en cours</p>
                  <dl className="text-muted-foreground mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-foreground">SIREN</dt>
                      <dd>{draft.currentCompany.siren || "Non renseigne"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">SIRET</dt>
                      <dd>{draft.currentCompany.siret || "Non renseigne"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        Nom commercial
                      </dt>
                      <dd>
                        {draft.currentCompany.companyName || "Non renseigne"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        Raison sociale
                      </dt>
                      <dd>
                        {draft.currentCompany.legalName || "Non renseigne"}
                      </dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="font-medium text-foreground">Site web</dt>
                      <dd>{draft.currentCompany.website || "Non renseigne"}</dd>
                    </div>
                  </dl>
                </div>

                {draft.companies.length > 0 ? (
                  <div className="rounded-[var(--radius-lg)] border border-border/70 bg-background/70 p-5">
                    <p className="text-sm font-semibold">
                      Entreprises deja ajoutees
                    </p>
                    <ul className="mt-4 space-y-3 text-sm">
                      {draft.companies.map((company, index) => (
                        <li
                          key={`${company.siren}-${company.siret}-${String(index)}`}
                          className="flex items-center justify-between rounded-[var(--radius-md)] border border-border/60 px-3 py-3"
                        >
                          <div>
                            <p className="font-medium">
                              {company.companyName || company.legalName || "Entreprise"}
                            </p>
                            <p className="text-muted-foreground">
                              SIREN {company.siren || "-"} · SIRET{" "}
                              {company.siret || "-"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" size="lg" onClick={addAnotherCompany}>
                    Ajouter une autre entreprise
                  </Button>
                  <form action={completeOnboardingAction} onSubmit={clearDraftStorage}>
                    <Button type="submit" size="lg" variant="outline">
                      Terminer l&apos;onboarding
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Les donnees du flow sont conservees temporairement dans ce
                navigateur.
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
                  <Button
                    type="button"
                    size="lg"
                    disabled={!canGoNext}
                    onClick={goToNextStep}
                  >
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
                  Revenir aux informations
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
