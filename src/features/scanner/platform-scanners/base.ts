import * as cheerio from "cheerio";

import {
  normalizeAddress,
  normalizeHours,
  normalizePhone,
  normalizeString,
  normalizeUrl,
} from "@/features/scanner/normalization";
import type {
  BusinessScanInput,
  DiscoveryCandidate,
  NormalizedHours,
  PlatformName,
  PlatformScanner,
  RawListingData,
} from "@/features/scanner/types";

type SearchResult = {
  title: string;
  snippet: string | null;
  url: string;
};

type JsonObject = Record<string, unknown>;

type PlatformScannerConfig = {
  discoverySiteQuery: string;
  discoveryHostnames: string[];
  fetchHostnames?: string[];
  platform: PlatformName;
  selectors?: {
    address?: string[];
    email?: string[];
    hours?: string[];
    name?: string[];
    phone?: string[];
    website?: string[];
  };
};

const DEFAULT_TIMEOUT_MS = 15_000;
const SEARCH_ENGINE_URL = "https://html.duckduckgo.com/html/";

function buildUserAgent() {
  return (
    process.env.SCANNER_USER_AGENT ??
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  );
}

function getTimeoutMs() {
  const raw = Number(process.env.SCANNER_HTTP_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, getTimeoutMs());

  try {
    const response = await fetch(url, {
      headers: {
        "accept-language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
        "user-agent": buildUserAgent(),
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)} while fetching ${url}.`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function matchesHost(url: string, hostnames: string[]) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    return hostnames.some(
      (allowedHostname) =>
        hostname === allowedHostname || hostname.endsWith(`.${allowedHostname}`),
    );
  } catch {
    return false;
  }
}

function buildQueries(discoverySiteQuery: string, business: BusinessScanInput) {
  return [
    `site:${discoverySiteQuery} "${business.name}" "${business.address}"`,
    `"${business.name}" "${business.phone}"`,
    `"${business.name}" "${business.address}" "${business.website}"`,
  ];
}

function extractDuckDuckGoTarget(href: string) {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const target = url.searchParams.get("uddg");

    return target ? decodeURIComponent(target) : url.toString();
  } catch {
    return href;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyStringToNull(value: string) {
  return value === "" ? null : value;
}

async function searchWeb(query: string) {
  const searchUrl = new URL(SEARCH_ENGINE_URL);

  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("kl", "fr-fr");

  const html = await fetchText(searchUrl.toString());
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((_, element) => {
    const anchor = $(element).find("a.result__a").first();
    const href = anchor.attr("href");

    if (!href) {
      return;
    }

    const url = extractDuckDuckGoTarget(href);

    results.push({
      title: anchor.text().trim(),
      snippet:
        $(element).find(".result__snippet").first().text().trim() || null,
      url,
    });
  });

  return results;
}

function extractJsonBlocks($: cheerio.CheerioAPI) {
  const blocks: unknown[] = [];

  for (const script of $('script[type="application/ld+json"]').toArray()) {
    const content = $(script).contents().text().trim();

    if (content === "") {
      continue;
    }

    try {
      const parsed = JSON.parse(content) as unknown;

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          blocks.push(item);
        }
      } else {
        blocks.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return blocks;
}

function hasSupportedSchemaType(value: unknown) {
  return (
    typeof value === "string" &&
    /LocalBusiness|Organization|Restaurant|Store|Place/i.test(value)
  );
}

function findGraphNode(blocks: unknown[]): JsonObject | null {
  for (const block of blocks) {
    if (!isJsonObject(block)) {
      continue;
    }

    const graph = block["@graph"];

    if (Array.isArray(graph)) {
      for (const node of graph) {
        if (isJsonObject(node) && hasSupportedSchemaType(node["@type"])) {
          return node;
        }
      }
    }

    if (hasSupportedSchemaType(block["@type"])) {
      return block;
    }
  }

  return null;
}

function getTextFromSelectors(
  $: cheerio.CheerioAPI,
  selectors: string[] | undefined,
) {
  for (const selector of selectors ?? []) {
    const text = $(selector).first().text().trim();

    if (text !== "") {
      return text;
    }
  }

  return null;
}

function getAttrFromSelectors(
  $: cheerio.CheerioAPI,
  selectors: string[] | undefined,
  attribute: string,
) {
  for (const selector of selectors ?? []) {
    const value = $(selector).first().attr(attribute)?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeAddressObject(value: unknown) {
  if (!isJsonObject(value)) {
    return null;
  }

  const parts = [
    value.streetAddress,
    value.postalCode,
    value.addressLocality,
    value.addressRegion,
    value.addressCountry,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeOpeningHoursSpecification(value: unknown): NormalizedHours | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const hours: Record<string, string[]> = {};

  for (const entry of value) {
    if (!isJsonObject(entry)) {
      continue;
    }

    const day = typeof entry.dayOfWeek === "string" ? entry.dayOfWeek : null;
    const opens = typeof entry.opens === "string" ? entry.opens : null;
    const closes = typeof entry.closes === "string" ? entry.closes : null;

    if (!day || !opens || !closes) {
      continue;
    }

    const key = day.split("/").pop()?.toLowerCase();

    if (!key) {
      continue;
    }

    const slots = hours[key] ?? [];

    slots.push(`${opens}-${closes}`);
    hours[key] = slots;
  }

  return normalizeHours(hours);
}

function parseListingHtml(
  html: string,
  pageUrl: string,
  selectors: PlatformScannerConfig["selectors"],
) {
  const $ = cheerio.load(html);
  const jsonBlocks = extractJsonBlocks($);
  const listing = findGraphNode(jsonBlocks);

  const nameFromJsonLd =
    typeof listing?.name === "string" ? listing.name.trim() : null;
  const addressFromJsonLd = normalizeAddressObject(listing?.address);
  const phoneFromJsonLd =
    typeof listing?.telephone === "string" ? listing.telephone.trim() : null;
  const emailFromJsonLd =
    typeof listing?.email === "string" ? listing.email.trim() : null;
  const websiteFromJsonLd =
    typeof listing?.url === "string" ? listing.url.trim() : null;
  const hoursFromJsonLd = normalizeOpeningHoursSpecification(
    listing?.openingHoursSpecification,
  );
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? null;
  const pageTitle = emptyStringToNull($("title").first().text().trim());
  const streetAddressMeta =
    $('meta[property="business:contact_data:street_address"]')
      .attr("content")
      ?.trim() ?? null;
  const telHref =
    $('a[href^="tel:"]').first().attr("href")?.replace(/^tel:/, "").trim() ?? null;
  const mailtoHref =
    $('a[href^="mailto:"]').first().attr("href")?.replace(/^mailto:/, "").trim() ??
    null;
  const addressTagText = emptyStringToNull($("address").first().text().trim());

  const name =
    nameFromJsonLd ??
    getAttrFromSelectors($, selectors?.name, "content") ??
    getTextFromSelectors($, selectors?.name) ??
    ogTitle ??
    pageTitle ??
    null;
  const address =
    addressFromJsonLd ??
    getTextFromSelectors($, selectors?.address) ??
    streetAddressMeta ??
    addressTagText ??
    null;
  const phone =
    phoneFromJsonLd ??
    getTextFromSelectors($, selectors?.phone) ??
    telHref ??
    null;
  const email =
    emailFromJsonLd ??
    getTextFromSelectors($, selectors?.email) ??
    mailtoHref ??
    null;
  const website =
    websiteFromJsonLd ??
    getAttrFromSelectors($, selectors?.website, "href") ??
    getTextFromSelectors($, selectors?.website) ??
    null;
  const hours =
    hoursFromJsonLd ?? normalizeHours(getTextFromSelectors($, selectors?.hours));

  return {
    address,
    email,
    hours,
    name,
    phone,
    rawData: {
      html,
      jsonLd: listing,
      pageTitle,
    },
    url: pageUrl,
    website,
  };
}

function deriveExternalId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const pathnameId = pathParts[pathParts.length - 1] ?? null;

    return pathnameId ?? parsedUrl.searchParams.get("cid");
  } catch {
    return null;
  }
}

function scoreCandidate(
  business: BusinessScanInput,
  candidate: Pick<DiscoveryCandidate, "title" | "address" | "phone">,
) {
  let score = 0;

  if (normalizePhone(candidate.phone) === normalizePhone(business.phone)) {
    score += 45;
  }

  if (
    candidate.address &&
    normalizeAddress(candidate.address) === normalizeAddress(business.address)
  ) {
    score += 35;
  }

  const normalizedTitle = normalizeString(candidate.title);
  const normalizedName = normalizeString(business.name);

  if (normalizedTitle === normalizedName) {
    score += 20;
  } else if (
    normalizedTitle &&
    normalizedName &&
    normalizedTitle.includes(normalizedName)
  ) {
    score += 10;
  }

  return Math.min(100, score);
}

export class HttpPlatformScanner implements PlatformScanner {
  readonly platform: PlatformName;
  readonly #discoverySiteQuery: string;
  readonly #discoveryHostnames: string[];
  readonly #fetchHostnames: string[];
  readonly #selectors: PlatformScannerConfig["selectors"];

  constructor(config: PlatformScannerConfig) {
    this.platform = config.platform;
    this.#discoverySiteQuery = config.discoverySiteQuery;
    this.#discoveryHostnames = config.discoveryHostnames;
    this.#fetchHostnames = config.fetchHostnames ?? config.discoveryHostnames;
    this.#selectors = config.selectors;
  }

  async discover(business: BusinessScanInput) {
    const results: DiscoveryCandidate[] = [];
    const seenUrls = new Set<string>();

    for (const query of buildQueries(this.#discoverySiteQuery, business)) {
      let searchResults: SearchResult[] = [];

      try {
        searchResults = await searchWeb(query);
      } catch {
        continue;
      }

      for (const result of searchResults) {
        if (
          seenUrls.has(result.url) ||
          !matchesHost(result.url, this.#discoveryHostnames)
        ) {
          continue;
        }

        seenUrls.add(result.url);

        try {
          const html = await fetchText(result.url);
          const parsed = parseListingHtml(html, result.url, this.#selectors);
          const candidate: DiscoveryCandidate = {
            address: parsed.address,
            confidenceScore: 0,
            phone: parsed.phone,
            rawData: {
              externalId: deriveExternalId(result.url),
              pageTitle: parsed.rawData.pageTitle,
              searchSnippet: result.snippet,
            },
            title: parsed.name ?? result.title,
            url: result.url,
          };

          candidate.confidenceScore = scoreCandidate(business, candidate);
          results.push(candidate);
        } catch {
          results.push({
            address: null,
            confidenceScore: scoreCandidate(business, {
              address: null,
              phone: null,
              title: result.title,
            }),
            phone: null,
            rawData: {
              externalId: deriveExternalId(result.url),
              searchSnippet: result.snippet,
            },
            title: result.title,
            url: result.url,
          });
        }

        if (results.length >= 5) {
          return results.sort(
            (left, right) => right.confidenceScore - left.confidenceScore,
          );
        }
      }
    }

    return results.sort((left, right) => right.confidenceScore - left.confidenceScore);
  }

  async fetch(url: string): Promise<RawListingData> {
    if (!matchesHost(url, this.#fetchHostnames)) {
      throw new Error(`Unsupported ${this.platform} listing URL: ${url}`);
    }

    const html = await fetchText(url);
    const parsed = parseListingHtml(html, url, this.#selectors);

    return {
      externalId: deriveExternalId(url),
      payload: {
        address: parsed.address,
        email: parsed.email,
        hours: parsed.hours,
        html,
        name: parsed.name,
        phone: parsed.phone,
        website: parsed.website,
      },
      platform: this.platform,
      url,
    };
  }

  normalize(raw: RawListingData) {
    return {
      address:
        typeof raw.payload.address === "string" ? raw.payload.address.trim() : null,
      email:
        typeof raw.payload.email === "string" ? raw.payload.email.trim() : null,
      hours: normalizeHours(raw.payload.hours),
      name: typeof raw.payload.name === "string" ? raw.payload.name.trim() : null,
      phone:
        typeof raw.payload.phone === "string" ? raw.payload.phone.trim() : null,
      website:
        typeof raw.payload.website === "string"
          ? normalizeUrl(raw.payload.website)
          : null,
    };
  }
}
