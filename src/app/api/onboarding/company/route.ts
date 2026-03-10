import { after, type NextRequest, NextResponse } from "next/server";

import { companyFormSchema } from "@/features/onboarding/company-form";
import {
  createScanBatch,
  enqueueScanJobs,
} from "@/features/scanner/orchestration";
import { triggerQueuedScanJobs } from "@/features/scanner/worker";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    companyId?: string;
    company?: unknown;
    completeOnboarding?: boolean;
  };
  const parsedCompany = companyFormSchema.safeParse(body.company);

  if (!parsedCompany.success) {
    const fieldErrors = Object.fromEntries(
      parsedCompany.error.issues
        .map((issue) => {
          const field = issue.path[0];

          return typeof field === "string" ? [field, issue.message] : null;
        })
        .filter((entry): entry is [string, string] => entry !== null),
    );

    return NextResponse.json(
      {
        message: "Veuillez corriger les champs requis.",
        fieldErrors,
      },
      { status: 422 },
    );
  }

  const companyPayload = {
    userId: session.user.id,
    name: parsedCompany.data.companyName,
    legalName: parsedCompany.data.legalName ?? null,
    siren: parsedCompany.data.siren === "" ? null : parsedCompany.data.siren,
    siret: parsedCompany.data.siret === "" ? null : parsedCompany.data.siret,
    addressLine: parsedCompany.data.addressLine,
    postalCode: parsedCompany.data.postalCode ?? null,
    city: parsedCompany.data.city ?? null,
    phone: parsedCompany.data.phone,
    email: parsedCompany.data.email,
    website: parsedCompany.data.website,
    activity: parsedCompany.data.activity ?? null,
  };
  const companySelect = {
    id: true,
    name: true,
    legalName: true,
    siren: true,
    siret: true,
    addressLine: true,
    postalCode: true,
    city: true,
    phone: true,
    email: true,
    website: true,
    activity: true,
  } as const;
  let company;
  let createdScanBatchId: string | null = null;

  if (typeof body.companyId === "string" && body.companyId !== "") {
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: body.companyId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { message: "Company not found." },
        { status: 404 },
      );
    }

    company = await prisma.company.update({
      where: {
        id: existingCompany.id,
      },
      data: companyPayload,
      select: companySelect,
    });
  } else {
    const createdResult = await prisma.$transaction(async (tx) => {
      const nextCompany = await tx.company.create({
        data: companyPayload,
        select: companySelect,
      });
      const scanBatch = await createScanBatch(session.user.id, tx);

      await enqueueScanJobs(scanBatch.id, [nextCompany.id], tx);

      return {
        company: nextCompany,
        scanBatchId: scanBatch.id,
      };
    });

    company = createdResult.company;
    createdScanBatchId = createdResult.scanBatchId;
  }

  if (body.completeOnboarding === true) {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingCompleted: true,
      },
    });
  }

  if (createdScanBatchId) {
    after(() => triggerQueuedScanJobs());
  }

  return NextResponse.json({
    company: {
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
    },
    scanBatchId: createdScanBatchId,
    redirectTo: body.completeOnboarding === true ? "/dashboard" : null,
  });
}
