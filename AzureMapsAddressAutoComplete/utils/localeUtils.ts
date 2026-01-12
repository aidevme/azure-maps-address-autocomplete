// AzureMapsAddressAutoComplete\utils\localeUtils.ts

/**
 * Default locale used when LCID mapping is not found.
 */
export const DEFAULT_LOCALE = "en-US";

/**
 * Maps LCID (Locale ID) to locale string format.
 * Microsoft language codes used in Dataverse.
 * @see https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-lcid/
 */
export const LCID_TO_LOCALE: Record<number, string> = {
  // Afrikaans
  1078: "af-ZA",
  // Arabic
  1025: "ar",
  // Bulgarian
  1026: "bg-BG",
  // Catalan
  1027: "ca-ES",
  // Czech
  1029: "cs-CZ",
  // Danish
  1030: "da-DK",
  // German
  1031: "de-DE",
  // Greek
  1032: "el-GR",
  // English
  3081: "en-AU",   // English (Australia)
  5129: "en-NZ",   // English (New Zealand)
  2057: "en-GB",   // English (United Kingdom)
  1033: "en-US",   // English (USA)
  // Spanish
  22538: "es-419", // Spanish (Latin America)
  3082: "es-ES",   // Spanish (Spain)
  1034: "es-ES",   // Spanish (Spain) - alternate
  2058: "es-MX",   // Spanish (Mexico)
  // Estonian
  1061: "et-EE",
  // Basque
  1069: "eu-ES",
  // Finnish
  1035: "fi-FI",
  // French
  3084: "fr-CA",   // French (Canada)
  1036: "fr-FR",   // French (France)
  // Galician
  1110: "gl-ES",
  // Hebrew
  1037: "he-IL",
  // Croatian
  1050: "hr-HR",
  // Hungarian
  1038: "hu-HU",
  // Indonesian
  1057: "id-ID",
  // Italian
  1040: "it-IT",
  // Kazakh
  1087: "kk-KZ",
  // Lithuanian
  1063: "lt-LT",
  // Latvian
  1062: "lv-LV",
  // Malay
  1086: "ms-MY",
  // Norwegian
  1044: "nb-NO",   // Norwegian Bokmål
  // Dutch
  2067: "nl-BE",   // Dutch (Belgium)
  1043: "nl-NL",   // Dutch (Netherlands)
  // Polish
  1045: "pl-PL",
  // Portuguese
  1046: "pt-BR",   // Portuguese (Brazil)
  2070: "pt-PT",   // Portuguese (Portugal)
  // Romanian
  1048: "ro-RO",
  // Russian
  1049: "ru-RU",
  // Slovak
  1051: "sk-SK",
  // Slovenian
  1060: "sl-SI",
  // Serbian (Cyrillic)
  10266: "sr-Cyrl-RS",
  // Swedish
  1053: "sv-SE",
  // Thai
  1054: "th-TH",
  // Turkish
  1055: "tr-TR",
  // Ukrainian
  1058: "uk-UA",
  // Vietnamese
  1066: "vi-VN",
  // Chinese
  2052: "zh-HanS-CN",  // Chinese (Simplified, China)
  1028: "zh-HanT-TW",  // Chinese (Traditional, Taiwan)
};

/**
 * Converts a language ID (LCID) to locale string format.
 *
 * @param lcid - The locale ID (e.g., 1033)
 * @returns The locale string (e.g., 'en-US') or DEFAULT_LOCALE as fallback
 *
 * @example
 * ```ts
 * const locale = lcidToLocale(1033);
 * // "en-US"
 *
 * const unknown = lcidToLocale(9999);
 * // "en-US" (default fallback)
 * ```
 *
 * @public
 */
export function lcidToLocale(lcid: number): string {
  return LCID_TO_LOCALE[lcid] ?? DEFAULT_LOCALE;
}

/**
 * Checks if a given LCID has a mapping in the locale table.
 *
 * @param lcid - The locale ID to check
 * @returns True if the LCID has a mapping, false otherwise
 *
 * @public
 */
export function hasLocaleMapping(lcid: number): boolean {
  return lcid in LCID_TO_LOCALE;
}
