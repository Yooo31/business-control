import { type NextRequest,NextResponse } from "next/server";

import {
  isValidSiren,
  isValidSiret,
  normalizeIdentifier,
} from "@/features/onboarding/company-lookup";
import { auth } from "@/lib/auth";
import { isInseeLookupConfigured, lookupCompanyByIdentifier } from "@/lib/insee";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isInseeLookupConfigured()) {
    return NextResponse.json(
      {
        message:
          "The Insee lookup is not configured. You can continue manually.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const siren = normalizeIdentifier(searchParams.get("siren") ?? "");
  const siret = normalizeIdentifier(searchParams.get("siret") ?? "");

  if (!isValidSiret(siret) && !isValidSiren(siren)) {
    return NextResponse.json(
      {
        message: "Provide a valid SIREN or SIRET before running the lookup.",
      },
      { status: 400 },
    );
  }

  try {
    const company = await lookupCompanyByIdentifier({ siren, siret });

    if (!company) {
      return NextResponse.json(
        {
          message:
            "No company was found for this identifier. You can continue manually.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "The government lookup is currently unavailable. You can continue manually.",
      },
      { status: 502 },
    );
  }
}
