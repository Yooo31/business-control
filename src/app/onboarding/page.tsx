import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { requireOnboardingUser } from "@/features/onboarding/lib";

export default async function OnboardingPage() {
  const user = await requireOnboardingUser();

  return (
    <OnboardingWizard
      userName={user.name}
      isOnboardingCompleted={user.onboardingCompleted}
      initialCompanies={user.companies.map((company) => ({
        id: company.id,
        siren: company.siren ?? "",
        siret: company.siret ?? "",
        companyName: company.name,
        legalName: company.legalName ?? "",
        addressLine: company.addressLine,
        postalCode: company.postalCode ?? "",
        city: company.city ?? "",
        phone: company.phone,
        email: company.email,
        activity: company.activity ?? "",
        website: company.website,
      }))}
    />
  );
}
