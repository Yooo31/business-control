"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function completeOnboardingAction() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login?callbackUrl=%2Fonboarding" as Route);
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      onboardingCompleted: true,
    },
  });

  redirect("/dashboard" as Route);
}
