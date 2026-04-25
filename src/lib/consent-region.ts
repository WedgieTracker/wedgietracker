// ISO 3166-1 alpha-2 codes for regions where explicit opt-in consent is
// required before storing analytics/advertising cookies (GDPR, UK GDPR, nFADP).
export const CONSENT_REQUIRED_REGIONS = [
  // EU
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA (non-EU)
  "IS",
  "LI",
  "NO",
  // UK
  "GB",
  // Switzerland
  "CH",
] as const;

export function isConsentRequiredCountry(
  country: string | null | undefined,
): boolean {
  if (!country) return true; // safe default when geo is unknown
  return (CONSENT_REQUIRED_REGIONS as readonly string[]).includes(
    country.toUpperCase(),
  );
}
