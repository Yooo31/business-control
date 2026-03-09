import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { requirePendingOnboardingUser } from "@/features/onboarding/lib";

export default async function OnboardingPage() {
  const user = await requirePendingOnboardingUser();

  return <OnboardingWizard userName={user.name} />;
}
