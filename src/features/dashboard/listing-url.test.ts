import { describe, expect, it } from "vitest";

import { validatePlatformListingUrl } from "./listing-url";

describe("validatePlatformListingUrl", () => {
  it("accepts a Google Maps URL", () => {
    const result = validatePlatformListingUrl(
      "GOOGLE",
      "https://www.google.com/maps/place/Test",
    );

    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBe("https://www.google.com/maps/place/Test");
  });

  it("rejects a URL from another platform", () => {
    const result = validatePlatformListingUrl(
      "APPLE",
      "https://www.google.com/maps/place/Test",
    );

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("maps.apple.com");
  });

  it("rejects malformed URLs", () => {
    const result = validatePlatformListingUrl("YELP", "not-a-url");

    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Saisissez une URL valide.");
  });
});
