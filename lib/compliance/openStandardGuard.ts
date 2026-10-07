// lib/compliance/openStandardGuard.ts
export const RESTRICTED_GEO_CODES = new Set([
  // EEA Nations (MiCA Corridor)
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", 
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", 
  "SI", "ES", "SE", "IS", "LI", "NO",
  // Sanctioned Jurisdictions
  "AF", "BY", "CD", "CU", "IR", "IQ", "LB", "LY", "MM", "KP", "RU", "SO", 
  "SS", "SD", "SY", "VE", "YE"
]);

export const RESTRICTED_CATEGORIES = new Set([
  "JEWELRY", "WATCHES", "LUXURY_GOODS", "PRECIOUS_METALS",
  "ADULT", "GAMBLING", "CANNABIS", "PHARMACEUTICALS", "WEAPONS"
]);

export function validateOusdEligibility(merchantCountry: string, itemCategory: string): boolean {
  if (RESTRICTED_GEO_CODES.has(merchantCountry.toUpperCase())) return false;
  if (RESTRICTED_CATEGORIES.has(itemCategory.toUpperCase())) return false;
  return true;
}