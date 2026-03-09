import { redirect } from "next/navigation";

import { requireOnboardedUser } from "@/features/onboarding/lib";

export default async function HomePage() {
  await requireOnboardedUser();
  redirect("/dashboard");
}
