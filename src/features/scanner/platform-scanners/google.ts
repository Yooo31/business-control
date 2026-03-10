import { HttpPlatformScanner } from "@/features/scanner/platform-scanners/base";

export class GoogleScanner extends HttpPlatformScanner {
  constructor() {
    super({
      discoverySiteQuery: "google.com/maps",
      platform: "google",
      discoveryHostnames: ["google.com"],
      fetchHostnames: ["google.com", "www.google.com"],
      selectors: {
        address: ['button[data-item-id*="address"]', 'meta[itemprop="address"]'],
        hours: ['table[aria-label*="Hours"]', 'div[aria-label*="Hours"]'],
        name: ['meta[property="og:title"]'],
        phone: ['button[data-item-id*="phone"]'],
        website: ['a[data-item-id="authority"]'],
      },
    });
  }
}
