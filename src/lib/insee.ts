import {
  type CompanyLookupResult,
  getHeadOfficeSiret,
  isValidSiren,
  isValidSiret,
  mapInseeCompanyLookupResponse,
} from "@/features/onboarding/company-lookup";

const INSEE_SIRENE_BASE_URL =
  process.env.INSEE_SIRENE_BASE_URL ?? "https://api.insee.fr/api-sirene/3.11";

function getInseeApiKey() {
  const apiKey = process.env.INSEE_API_KEY;

  return apiKey && apiKey.trim() !== "" ? apiKey : null;
}

export function isInseeLookupConfigured() {
  return getInseeApiKey() !== null;
}

async function fetchInseeResource(pathname: string) {
  const apiKey = getInseeApiKey();

  if (!apiKey) {
    throw new Error("INSEE_API_KEY must be configured.");
  }

  const response = await fetch(`${INSEE_SIRENE_BASE_URL}${pathname}`, {
    headers: {
      Accept: "application/json",
      "X-INSEE-Api-Key-Integration": apiKey,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      "Insee lookup failed with status " + String(response.status) + ".",
    );
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function lookupCompanyByIdentifier({
  siren,
  siret,
}: {
  siren: string;
  siret: string;
}): Promise<CompanyLookupResult | null> {
  if (isValidSiret(siret)) {
    const etablissementPayload = await fetchInseeResource(`/siret/${siret}`);

    if (!etablissementPayload) {
      return null;
    }

    return mapInseeCompanyLookupResponse(etablissementPayload);
  }

  if (!isValidSiren(siren)) {
    return null;
  }

  const uniteLegalePayload = await fetchInseeResource(`/siren/${siren}`);

  if (!uniteLegalePayload) {
    return null;
  }

  const uniteLegale =
    typeof uniteLegalePayload.uniteLegale === "object" &&
    uniteLegalePayload.uniteLegale !== null
      ? (uniteLegalePayload.uniteLegale as Record<string, unknown>)
      : null;
  const headOfficeSiret = uniteLegale ? getHeadOfficeSiret(uniteLegale) : "";

  if (!headOfficeSiret) {
    return mapInseeCompanyLookupResponse(uniteLegalePayload);
  }

  const headOfficePayload = await fetchInseeResource(`/siret/${headOfficeSiret}`);

  if (!headOfficePayload) {
    return mapInseeCompanyLookupResponse(uniteLegalePayload);
  }

  return mapInseeCompanyLookupResponse(headOfficePayload);
}
