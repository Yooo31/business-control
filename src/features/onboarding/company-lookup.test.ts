import { describe, expect, it } from "vitest";

import {
  getHeadOfficeSiret,
  isValidSiren,
  isValidSiret,
  mapInseeCompanyLookupResponse,
  normalizeIdentifier,
} from "@/features/onboarding/company-lookup";

describe("company lookup helpers", () => {
  it("normalizes identifiers and validates SIREN/SIRET", () => {
    expect(normalizeIdentifier("732 829 320")).toBe("732829320");
    expect(isValidSiren("732829320")).toBe(true);
    expect(isValidSiren("123456789")).toBe(false);
    expect(isValidSiret("73282932000074")).toBe(true);
    expect(isValidSiret("73282932000075")).toBe(false);
  });

  it("maps an Insee payload to internal fields", () => {
    const company = mapInseeCompanyLookupResponse({
      etablissement: {
        siret: "73282932000074",
        siren: "732829320",
        numeroVoieEtablissement: "8",
        typeVoieEtablissement: "RUE",
        libelleVoieEtablissement: "DE VALOIS",
        codePostalEtablissement: "75001",
        libelleCommuneEtablissement: "PARIS",
        uniteLegale: {
          siren: "732829320",
          periodesUniteLegale: [
            {
              denominationUniteLegale: "OPENAI FRANCE",
              activitePrincipaleUniteLegale: "62.01Z",
            },
          ],
        },
      },
    });

    expect(company).toEqual({
      siren: "732829320",
      siret: "73282932000074",
      companyName: "OPENAI FRANCE",
      legalName: "OPENAI FRANCE",
      addressLine: "8 RUE DE VALOIS",
      postalCode: "75001",
      city: "PARIS",
      phone: "",
      activity: "62.01Z",
    });
  });

  it("builds the head office SIRET from the legal unit payload", () => {
    expect(
      getHeadOfficeSiret({
        siren: "732829320",
        periodesUniteLegale: [
          {
            nicSiegeUniteLegale: "00074",
          },
        ],
      }),
    ).toBe("73282932000074");
  });
});
