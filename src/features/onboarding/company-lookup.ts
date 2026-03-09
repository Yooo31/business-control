export type CompanyLookupResult = {
  siren: string;
  siret: string;
  companyName: string;
  legalName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  phone: string;
  activity: string;
};

type InseeCompanyPayload = {
  etablissement?: Record<string, unknown>;
  uniteLegale?: Record<string, unknown>;
};

export function normalizeIdentifier(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidLuhn(value: string) {
  let sum = 0;
  let shouldDouble = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const digit = Number(value[index]);

    if (Number.isNaN(digit)) {
      return false;
    }

    const normalizedDigit = shouldDouble
      ? ((digit * 2) % 10) + Math.floor((digit * 2) / 10)
      : digit;

    sum += normalizedDigit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function isValidSiren(value: string) {
  return value.length === 9 && isValidLuhn(value);
}

export function isValidSiret(value: string) {
  return value.length === 14 && isValidLuhn(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    const normalizedValue = readString(value);

    if (normalizedValue !== "") {
      return normalizedValue;
    }
  }

  return "";
}

function readCurrentPeriod(uniteLegale: Record<string, unknown> | undefined) {
  const periods: unknown = uniteLegale?.periodesUniteLegale;

  if (!Array.isArray(periods)) {
    return undefined;
  }

  const typedPeriods = periods as unknown[];
  const currentPeriod = typedPeriods.find((period) => {
    if (!isObject(period)) {
      return false;
    }

    return readString(period.dateFin) === "";
  });

  return isObject(currentPeriod)
    ? currentPeriod
    : isObject(typedPeriods[0])
      ? typedPeriods[0]
      : undefined;
}

function buildPersonLegalName(
  uniteLegale: Record<string, unknown> | undefined,
  currentPeriod: Record<string, unknown> | undefined,
) {
  const nameParts = [
    pickFirstString(
      uniteLegale?.prenomUsuelUniteLegale,
      uniteLegale?.prenom1UniteLegale,
      currentPeriod?.prenomUsuelUniteLegale,
      currentPeriod?.prenom1UniteLegale,
    ),
    pickFirstString(
      uniteLegale?.nomUniteLegale,
      currentPeriod?.nomUniteLegale,
      uniteLegale?.nomUsageUniteLegale,
      currentPeriod?.nomUsageUniteLegale,
    ),
  ].filter((value) => value !== "");

  return nameParts.join(" ").trim();
}

function buildAddressLine(etablissement: Record<string, unknown> | undefined) {
  const address = isObject(etablissement?.adresseEtablissement)
    ? etablissement.adresseEtablissement
    : undefined;

  return [
    pickFirstString(address?.numeroVoie, etablissement?.numeroVoieEtablissement),
    pickFirstString(address?.typeVoie, etablissement?.typeVoieEtablissement),
    pickFirstString(
      address?.libelleVoie,
      address?.libelleVoieEtablissement,
      etablissement?.libelleVoieEtablissement,
    ),
  ]
    .filter((value) => value !== "")
    .join(" ")
    .trim();
}

export function mapInseeCompanyLookupResponse(payload: InseeCompanyPayload) {
  const etablissement = isObject(payload.etablissement)
    ? payload.etablissement
    : undefined;
  const uniteLegale =
    isObject(etablissement?.uniteLegale)
      ? etablissement.uniteLegale
      : isObject(payload.uniteLegale)
        ? payload.uniteLegale
        : undefined;
  const currentPeriod = readCurrentPeriod(uniteLegale);
  const denomination = pickFirstString(
    uniteLegale?.denominationUniteLegale,
    currentPeriod?.denominationUniteLegale,
    uniteLegale?.denominationUsuelle1UniteLegale,
    currentPeriod?.denominationUsuelle1UniteLegale,
  );
  const legalName = pickFirstString(
    denomination,
    buildPersonLegalName(uniteLegale, currentPeriod),
  );
  const address = isObject(etablissement?.adresseEtablissement)
    ? etablissement.adresseEtablissement
    : undefined;

  return {
    siren: pickFirstString(uniteLegale?.siren, etablissement?.siren),
    siret: pickFirstString(etablissement?.siret),
    companyName: denomination,
    legalName,
    addressLine: buildAddressLine(etablissement),
    postalCode: pickFirstString(
      address?.codePostal,
      address?.codePostalEtablissement,
      etablissement?.codePostalEtablissement,
    ),
    city: pickFirstString(
      address?.libelleCommune,
      address?.libelleCommuneEtablissement,
      etablissement?.libelleCommuneEtablissement,
    ),
    phone: pickFirstString(
      etablissement?.telephone,
      etablissement?.telephoneEtablissement,
      uniteLegale?.telephone,
    ),
    activity: pickFirstString(
      currentPeriod?.activitePrincipaleUniteLegale,
      uniteLegale?.activitePrincipaleUniteLegale,
      etablissement?.activitePrincipaleEtablissement,
    ),
  } satisfies CompanyLookupResult;
}

export function getHeadOfficeSiret(uniteLegale: Record<string, unknown>) {
  const currentPeriod = readCurrentPeriod(uniteLegale);
  const siren = pickFirstString(uniteLegale.siren);
  const nic = pickFirstString(
    uniteLegale.nicSiegeUniteLegale,
    currentPeriod?.nicSiegeUniteLegale,
  );

  if (!isValidSiren(siren) || nic.length !== 5) {
    return "";
  }

  return `${siren}${nic}`;
}
