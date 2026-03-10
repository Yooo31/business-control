import { describe, expect, it } from "vitest";

import { compareListings } from "@/features/scanner/comparison";

describe("compareListings", () => {
  it("ignores formatting-only differences", () => {
    const mismatches = compareListings(
      {
        name: "Business Control",
        address: "10 Rue de Paris 75001 Paris",
        phone: "+33 6 12 34 56 78",
        email: "contact@businesscontrol.fr",
        website: "https://www.businesscontrol.fr/",
        hours: null,
      },
      {
        name: "business control",
        address: "10   Rue de Paris, 75001 Paris",
        phone: "06 12 34 56 78",
        email: "contact@businesscontrol.fr",
        website: "https://businesscontrol.fr",
        hours: null,
      },
    );

    expect(mismatches).toHaveLength(0);
  });

  it("returns mismatches when actual data differs", () => {
    const mismatches = compareListings(
      {
        name: "Business Control",
        address: "10 Rue de Paris 75001 Paris",
        phone: "06 12 34 56 78",
        email: "contact@businesscontrol.fr",
        website: "https://businesscontrol.fr",
        hours: null,
      },
      {
        name: "Business Control Store",
        address: "12 Rue de Paris 75001 Paris",
        phone: "06 00 00 00 00",
        email: "contact@businesscontrol.fr",
        website: "https://businesscontrol.fr",
        hours: null,
      },
    );

    expect(mismatches.map((mismatch) => mismatch.field)).toEqual([
      "name",
      "address",
      "phone",
    ]);
  });
});
