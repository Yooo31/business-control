import { normalizeListing } from "@/features/scanner/normalization";
import type { BusinessScanInput } from "@/features/scanner/types";
import type { Company } from "@/generated/prisma/client";

export function buildBusinessScanInput(company: Company): BusinessScanInput {
  return {
    id: company.id,
    organizationId: company.userId,
    name: company.name,
    address: [company.addressLine, company.postalCode, company.city]
      .filter((value): value is string => Boolean(value))
      .join(" "),
    phone: company.phone,
    email: company.email,
    website: company.website,
    hours: null,
  };
}

export function buildSourceOfTruthListing(company: Company) {
  return normalizeListing({
    name: company.name,
    address: [company.addressLine, company.postalCode, company.city]
      .filter((value): value is string => Boolean(value))
      .join(" "),
    phone: company.phone,
    email: company.email,
    website: company.website,
    hours: null,
  });
}
