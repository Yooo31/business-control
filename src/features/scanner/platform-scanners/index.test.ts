import { describe, expect, it } from "vitest";

import { getPlatformScanner } from "@/features/scanner/platform-scanners";
import {
  fixtureUrlByPlatform,
  sampleListingHtml,
} from "@/features/scanner/platform-scanners/fixtures";
import type { PlatformScanner } from "@/features/scanner/types";

describe("platform scanners", () => {
  it("normalizes fetched platform listing payloads", async () => {
    const originalFetch = global.fetch;

    try {
      global.fetch = (() =>
        Promise.resolve(
          new Response(sampleListingHtml, {
            status: 200,
            headers: {
              "content-type": "text/html",
            },
          }),
        )) as typeof fetch;

      const scanner: PlatformScanner = getPlatformScanner("google");
      const raw = await scanner.fetch(fixtureUrlByPlatform.google);
      const normalized = scanner.normalize(raw);

      expect(raw.platform).toBe("google");
      expect(normalized.name).toBe("Business Control");
      expect(normalized.phone).toBe("+33 6 12 34 56 78");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
