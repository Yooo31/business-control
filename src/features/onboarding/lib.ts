import type { Route } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      onboardingCompleted: true,
    },
  });
}

export async function requirePendingOnboardingUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?callbackUrl=%2Fonboarding" as Route);
  }

  if (user.onboardingCompleted) {
    redirect("/dashboard" as Route);
  }

  return user;
}

export async function requireOnboardedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?callbackUrl=%2Fdashboard" as Route);
  }

  if (!user.onboardingCompleted) {
    redirect("/onboarding" as Route);
  }

  return user;
}
