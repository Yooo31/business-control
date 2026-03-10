import { describe, expect, it } from "vitest";

import {
  normalizeAddress,
  normalizePhone,
  normalizeUrl,
} from "@/features/scanner/normalization";

describe("scanner normalization", () => {
  it("normalizes french phone numbers", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("0612345678");
  });

  it("normalizes urls without trailing slashes", () => {
    expect(normalizeUrl("https://www.example.com/")).toBe(
      "https://example.com",
    );
  });

  it("normalizes addresses with extra whitespace", () => {
    expect(normalizeAddress("10   Rue   de Paris, 75001 Paris")).toBe(
      "10 rue de paris 75001 paris",
    );
  });
});
