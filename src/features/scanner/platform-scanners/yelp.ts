import { HttpPlatformScanner } from "@/features/scanner/platform-scanners/base";

export class YelpScanner extends HttpPlatformScanner {
  constructor() {
    super({
      discoverySiteQuery: "yelp.com/biz",
      platform: "yelp",
      discoveryHostnames: ["yelp.com"],
      fetchHostnames: ["yelp.com", "www.yelp.com"],
      selectors: {
        address: ['address p', 'meta[property="business:contact_data:street_address"]'],
        hours: ['table[aria-label*="Hours"]', 'section:contains("Hours")'],
        name: ['meta[property="og:title"]', "h1"],
        phone: ['p:contains("+")', 'a[href^="tel:"]'],
        website: ['a[href*="biz_redir"]', 'a[href^="http"]:not([href*="yelp.com"])'],
      },
    });
  }
}
