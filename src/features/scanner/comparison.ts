import { FIELD_SEVERITY } from "@/features/scanner/constants";
import {
  normalizeListing,
  normalizeString,
  serializeHours,
} from "@/features/scanner/normalization";
import type {
  ListingField,
  ListingMismatchInput,
  NormalizedListing,
} from "@/features/scanner/types";

function toDisplayValue(value: string | null | undefined) {
  return value ? value.trim() : null;
}

function compareField(
  field: ListingField,
  expectedValue: string | null,
  actualValue: string | null,
) {
  if (!expectedValue && !actualValue) {
    return null;
  }

  if (expectedValue === actualValue) {
    return null;
  }

  return {
    field,
    expectedValue,
    actualValue,
    severity: FIELD_SEVERITY[field],
  } satisfies ListingMismatchInput;
}

export function compareListings(
  sourceOfTruth: NormalizedListing,
  observedListing: NormalizedListing,
) {
  const expected = normalizeListing(sourceOfTruth);
  const actual = normalizeListing(observedListing);
  const mismatches: ListingMismatchInput[] = [];

  const scalarFields: (keyof Omit<NormalizedListing, "hours">)[] = [
    "name",
    "address",
    "phone",
    "email",
    "website",
  ];

  for (const field of scalarFields) {
    const mismatch = compareField(field, expected[field], actual[field]);

    if (mismatch) {
      mismatches.push(mismatch);
    }
  }

  const hoursMismatch = compareField(
    "hours",
    serializeHours(expected.hours),
    serializeHours(actual.hours),
  );

  if (hoursMismatch) {
    mismatches.push(hoursMismatch);
  }

  return mismatches.map((mismatch) => ({
    ...mismatch,
    expectedValue:
      mismatch.field === "hours"
        ? mismatch.expectedValue
        : toDisplayValue(normalizeString(mismatch.expectedValue)),
    actualValue:
      mismatch.field === "hours"
        ? mismatch.actualValue
        : toDisplayValue(normalizeString(mismatch.actualValue)),
  }));
}
