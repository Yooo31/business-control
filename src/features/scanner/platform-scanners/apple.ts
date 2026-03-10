import { HttpPlatformScanner } from "@/features/scanner/platform-scanners/base";

export class AppleMapsScanner extends HttpPlatformScanner {
  constructor() {
    super({
      discoverySiteQuery: "maps.apple.com",
      platform: "apple",
      discoveryHostnames: ["maps.apple.com", "apple.com"],
      fetchHostnames: ["maps.apple.com"],
      selectors: {
        address: ["address", '[data-testid="address"]'],
        name: ['meta[property="og:title"]'],
        phone: ['a[href^="tel:"]'],
        website: ['a[href^="http"]:not([href*="apple.com"])'],
      },
    });
  }
}
