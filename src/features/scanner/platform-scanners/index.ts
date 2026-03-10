import { AppleMapsScanner } from "@/features/scanner/platform-scanners/apple";
import { GoogleScanner } from "@/features/scanner/platform-scanners/google";
import { YelpScanner } from "@/features/scanner/platform-scanners/yelp";
import type { PlatformName, PlatformScanner } from "@/features/scanner/types";

const scanners: Record<PlatformName, PlatformScanner> = {
  google: new GoogleScanner(),
  apple: new AppleMapsScanner(),
  yelp: new YelpScanner(),
};

export function getPlatformScanner(platform: PlatformName) {
  return scanners[platform];
}
