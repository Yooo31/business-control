import type { PlatformName } from "@/generated/prisma/client";

const platformRules: Record<
  PlatformName,
  { example: string; isMatch: (url: URL) => boolean }
> = {
  GOOGLE: {
    example: "google.com/maps",
    isMatch: (url) =>
      (url.hostname === "maps.google.com" ||
        url.hostname === "www.google.com" ||
        url.hostname.endsWith(".google.com")) &&
      url.pathname.toLowerCase().includes("/maps"),
  },
  APPLE: {
    example: "maps.apple.com",
    isMatch: (url) =>
      url.hostname === "maps.apple.com" ||
      url.hostname.endsWith(".maps.apple.com"),
  },
  YELP: {
    example: "yelp.com",
    isMatch: (url) =>
      url.hostname === "yelp.com" || url.hostname.endsWith(".yelp.com"),
  },
};

export function validatePlatformListingUrl(
  platform: PlatformName,
  input: string,
) {
  const trimmedInput = input.trim();

  if (trimmedInput === "") {
    return {
      isValid: false,
      message: "L'URL de la fiche est requise.",
      normalizedUrl: null,
    };
  }

  let url: URL;

  try {
    url = new URL(trimmedInput);
  } catch {
    return {
      isValid: false,
      message: "Saisissez une URL valide.",
      normalizedUrl: null,
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      isValid: false,
      message: "L'URL doit commencer par http:// ou https://.",
      normalizedUrl: null,
    };
  }

  url.hostname = url.hostname.toLowerCase();

  if (!platformRules[platform].isMatch(url)) {
    return {
      isValid: false,
      message: `L'URL doit correspondre a ${platformRules[platform].example}.`,
      normalizedUrl: null,
    };
  }

  return {
    isValid: true,
    message: null,
    normalizedUrl: url.toString(),
  };
}
