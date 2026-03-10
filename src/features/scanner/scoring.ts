import { COMPARABLE_FIELDS_COUNT } from "@/features/scanner/constants";
import type { ListingMismatchInput } from "@/features/scanner/types";

export function computeComplianceScore(mismatches: ListingMismatchInput[]) {
  const penalty = Math.round(
    (mismatches.length / COMPARABLE_FIELDS_COUNT) * 100,
  );

  return Math.max(0, 100 - penalty);
}
