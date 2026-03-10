import type {
  NormalizedHours,
  NormalizedListing,
} from "@/features/scanner/types";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeNullableString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = normalizeWhitespace(value);

  return normalized === "" ? null : normalized;
}

export function normalizeString(value: string | null | undefined) {
  const normalized = normalizeNullableString(value);

  return normalized?.toLowerCase() ?? null;
}

export function normalizePhone(value: string | null | undefined) {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/[^\d+]/g, "");

  if (digits.startsWith("+33")) {
    return `0${digits.slice(3)}`;
  }

  if (digits.startsWith("33") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  return digits.replace(/\D/g, "") || null;
}

export function normalizeUrl(value: string | null | undefined) {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    url.protocol = url.protocol.toLowerCase();
    url.hostname = hostname;
    url.pathname = pathname === "/" ? "" : pathname;
    url.hash = "";

    if (
      (url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")
    ) {
      url.port = "";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return normalizeString(normalized);
  }
}

export function normalizeAddress(value: string | null | undefined) {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\b(st|ste|suite)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHoursEntry(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((slot): slot is string => typeof slot === "string")
    .map((slot) => normalizeWhitespace(slot).toLowerCase())
    .filter((slot) => slot.length > 0)
    .sort();
}

export function normalizeHours(value: unknown): NormalizedHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries: [string, string[]][] = Object.entries(value).map(
    ([day, slots]) => [
      day.toLowerCase(),
      normalizeHoursEntry(slots),
    ],
  );
  const normalizedEntries = entries.filter(([, slots]) => slots.length > 0);

  if (normalizedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(normalizedEntries);
}

export function normalizeListing(
  listing: Partial<NormalizedListing>,
): NormalizedListing {
  return {
    name: normalizeString(listing.name),
    address: normalizeAddress(listing.address),
    phone: normalizePhone(listing.phone),
    email: normalizeString(listing.email),
    website: normalizeUrl(listing.website),
    hours: normalizeHours(listing.hours),
  };
}

export function serializeHours(hours: NormalizedHours | null) {
  if (!hours) {
    return null;
  }

  return JSON.stringify(
    Object.fromEntries(
      Object.entries(hours).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
}
