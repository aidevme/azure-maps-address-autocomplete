import type { AzureMapsSearchResult } from '../services';
import { createPostalCodeResult } from '../services';

// ============================================================================
// Constants
// ============================================================================

/** Minimum characters required to show suggestions dropdown. */
export const MIN_CHARS_FOR_SUGGESTIONS = 2;

/** Debounce delay in milliseconds for API calls. */
export const DEBOUNCE_DELAY = 300;

/** Regular expression to match country code prefix pattern: "CC, query" */
const COUNTRY_CODE_PATTERN = /^([A-Za-z]{2})\s*,\s*(.+)$/;

/** Regular expression to match city-only postal code search pattern: "PLZ: city" or "#city" */
const CITY_POSTALCODE_PATTERN = /^(?:PLZ:|#)\s*(.+)$/i;

/** Regular expression to match country code + postal code pattern: "CC,postalcode" (postal code is numeric) */
const COUNTRY_POSTALCODE_PATTERN = /^([A-Za-z]{2})\s*,\s*(\d+)$/;

/** Regular expression to match country code + city postal code search pattern: "CC#city" */
const COUNTRY_CITY_POSTALCODE_PATTERN = /^([A-Za-z]{2})#\s*(.+)$/;

// ============================================================================
// Types
// ============================================================================

/** Search type enum for different search behaviors. */
export type SearchType = 'address' | 'postalcode' | 'postalcode-to-city';

/**
 * Search pattern result containing the parsed query and optional country set.
 */
export interface SearchPatternResult {
  /** The search query to send to Azure Maps API. */
  query: string;
  /** The country set to filter results (ISO 3166-1 alpha-2 codes). */
  countrySet?: string;
  /** The type of search to perform. */
  searchType: SearchType;
}

/**
 * Type for the postal code fetcher function.
 */
export type PostalCodeFetcher = (
  municipalityName: string,
  countryCode: string,
  position: { lat: number; lon: number }
) => Promise<string[]>;

// ============================================================================
// Search Pattern Parsing
// ============================================================================

/**
 * Parses the input value to determine the search pattern.
 * 
 * **Search Patterns:**
 * 
 * 1. **Country Set Provided (prop):** When `countrySet` prop is provided (single or multiple countries),
 *    the entire input is used as the search query and results are filtered by the provided countries.
 *    - Example: countrySet="US" with input "New York" → searches "New York" in US
 *    - Example: countrySet="US,CA,MX" with input "Toronto" → searches "Toronto" in US, CA, MX
 * 
 * 2. **Country Set Not Provided:** When no `countrySet` prop is provided, the component attempts to
 *    parse a country code from the input using the format "CC, query" where CC is a 2-letter
 *    ISO 3166-1 alpha-2 country code.
 *    - Example: "CH, Zurich" → searches "Zurich" in Switzerland
 *    - Example: "DE, Berlin" → searches "Berlin" in Germany
 *    - Example: "Zurich" (no prefix) → searches "Zurich" globally (no country filter)
 * 
 * 3. **City-Only Postal Code Search:** When input starts with "PLZ:" or "#", searches for postal codes
 *    in the specified city using Azure Maps Fuzzy Search with PostalCodeArea entity type.
 *    - Example: "PLZ: Zurich" → searches postal codes in Zurich
 *    - Example: "#Berlin" → searches postal codes in Berlin
 * 
 * 4. **Postal Code to City Search:** When input is "CC,postalcode" (country code + numeric postal code),
 *    searches for the city/location of that postal code.
 *    - Example: "CH,8001" → returns city for postal code 8001 in Switzerland (Zurich)
 *    - Example: "DE,10115" → returns city for postal code 10115 in Germany (Berlin)
 * 
 * 5. **Country + City Postal Code Search:** When input is "CC#city" (country code + hash + city name),
 *    searches for postal codes in the specified city within the specified country.
 *    - Example: "CH#Zürich" → searches postal codes in Zürich, Switzerland
 *    - Example: "DE#Berlin" → searches postal codes in Berlin, Germany
 * 
 * @param inputValue - The raw input value from the user.
 * @param countrySetProp - The optional countrySet prop value.
 * @returns The parsed search pattern with query, optional country set, and search type.
 */
export function parseSearchPattern(inputValue: string, countrySetProp?: string): SearchPatternResult {
  // Normalize countrySetProp - treat empty or whitespace-only strings as undefined
  const normalizedCountrySet = countrySetProp?.trim() ?? undefined;

  // Pattern 5: Country code + city postal code search (CC#city)
  const countryCityMatch = COUNTRY_CITY_POSTALCODE_PATTERN.exec(inputValue);
  if (countryCityMatch) {
    const [, countryCode, city] = countryCityMatch;
    return {
      query: city.trim(),
      countrySet: countryCode.toUpperCase(),
      searchType: 'postalcode'
    };
  }

  // Pattern 3: City-only postal code search (PLZ: city or #city)
  const cityMatch = CITY_POSTALCODE_PATTERN.exec(inputValue);
  if (cityMatch) {
    return {
      query: cityMatch[1].trim(),
      countrySet: normalizedCountrySet,
      searchType: 'postalcode'
    };
  }

  // Pattern 4: Country code + postal code to city search (CC,postalcode)
  const postalCodeMatch = COUNTRY_POSTALCODE_PATTERN.exec(inputValue);
  if (postalCodeMatch) {
    const [, countryCode, postalCode] = postalCodeMatch;
    return {
      query: postalCode,
      countrySet: countryCode.toUpperCase(),
      searchType: 'postalcode-to-city'
    };
  }

  // Pattern 1: Country set provided via prop (single or multiple countries)
  if (normalizedCountrySet) {
    return {
      query: inputValue,
      countrySet: normalizedCountrySet,
      searchType: 'address'
    };
  }

  // Pattern 2: No country set prop - try to parse from input
  const match = COUNTRY_CODE_PATTERN.exec(inputValue);
  if (match) {
    const [, countryCode, query] = match;
    return {
      query: query.trim(),
      countrySet: countryCode.toUpperCase(),
      searchType: 'address'
    };
  }

  // No country filter - search globally
  return {
    query: inputValue,
    countrySet: undefined,
    searchType: 'address'
  };
}

// ============================================================================
// Query Building
// ============================================================================

/**
 * Builds the API query string based on search type.
 * For address searches without numbers, prepends "1" to get street-level results.
 *
 * @param searchQuery - The original search query.
 * @param searchType - The type of search being performed.
 * @returns The query string to send to the API.
 */
export function buildApiQuery(searchQuery: string, searchType: SearchType): string {
  if (searchType !== 'postalcode-to-city' && searchType !== 'postalcode') {
    const hasNumber = /\d/.test(searchQuery);
    if (!hasNumber) {
      return `1 ${searchQuery}`;
    }
  }
  return searchQuery;
}

// ============================================================================
// Result Filtering
// ============================================================================

/**
 * Filters municipalities to exclude those where the search term appears in parentheses.
 * This prevents matching "Basel-Landschaft (Basel)" when searching for "Basel".
 *
 * @param results - The normalized search results.
 * @param searchQuery - The original search query.
 * @returns Filtered results excluding parenthetical matches.
 */
export function filterMunicipalitiesBySearchQuery(
  results: AzureMapsSearchResult[],
  searchQuery: string
): AzureMapsSearchResult[] {
  const searchQueryLower = searchQuery.toLowerCase();
  return results.filter((result) => {
    const municipality = result.address.municipality ?? result.address.freeformAddress ?? '';

    // Exclude municipalities where the search term appears in parentheses
    const hasParentheses = municipality.includes('(') && municipality.includes(')');
    if (hasParentheses) {
      const parenthesesMatch = /\(([^)]+)\)/.exec(municipality);
      if (parenthesesMatch) {
        const inParentheses = parenthesesMatch[1].toLowerCase();
        if (inParentheses.includes(searchQueryLower) || searchQueryLower.includes(inParentheses)) {
          return false;
        }
      }
    }

    return true;
  });
}

// ============================================================================
// Result Processing
// ============================================================================

/**
 * Processes results for postal code to city searches.
 * Deduplicates by municipality and returns unique cities sorted alphabetically.
 *
 * @param results - The normalized search results.
 * @returns Deduplicated and sorted city results.
 */
export function processPostalCodeToCityResults(
  results: AzureMapsSearchResult[]
): AzureMapsSearchResult[] {
  const seenCities = new Set<string>();
  return results
    .filter((result) => {
      const city = result.address.municipality ?? result.address.localName ?? '';
      if (!city || seenCities.has(city)) {
        return false;
      }
      seenCities.add(city);
      return true;
    })
    .sort((a, b) => {
      const cityA = a.address.municipality ?? a.address.localName ?? '';
      const cityB = b.address.municipality ?? b.address.localName ?? '';
      return cityA.localeCompare(cityB);
    });
}

/**
 * Processes results for standard address searches.
 * Sorts results by postal code.
 *
 * @param results - The normalized search results.
 * @returns Results sorted by postal code.
 */
export function processAddressResults(
  results: AzureMapsSearchResult[]
): AzureMapsSearchResult[] {
  return results.sort((a, b) => {
    const postalCodeA = a.address.postalCode ?? '';
    const postalCodeB = b.address.postalCode ?? '';
    return postalCodeA.localeCompare(postalCodeB);
  });
}

/**
 * Processes postal code search results.
 * Filters municipalities and fetches postal codes for the first match.
 *
 * @param results - The normalized search results.
 * @param searchQuery - The original search query.
 * @param effectiveCountrySet - The country set to use.
 * @param getPostalCodes - Function to fetch postal codes for a municipality.
 * @returns Processed results with postal codes or filtered municipalities.
 */
export async function processPostalCodeResults(
  results: AzureMapsSearchResult[],
  searchQuery: string,
  effectiveCountrySet: string | undefined,
  getPostalCodes: PostalCodeFetcher
): Promise<AzureMapsSearchResult[]> {
  const filteredMunicipalities = filterMunicipalitiesBySearchQuery(results, searchQuery);

  // Fetch postal codes for the first municipality found
  const municipalityWithPosition = filteredMunicipalities.find(r => r.position && r.address.municipality);
  if (!municipalityWithPosition) {
    return filteredMunicipalities;
  }

  const municipalityName = municipalityWithPosition.address.municipality ?? '';
  const countryCode = municipalityWithPosition.address.countryCode ?? effectiveCountrySet ?? '';
  const postalCodes = await getPostalCodes(municipalityName, countryCode, municipalityWithPosition.position);

  if (postalCodes.length > 0) {
    // Create results for each postal code using the service helper
    return postalCodes.map((postalCode) =>
      createPostalCodeResult(postalCode, municipalityWithPosition)
    );
  }

  // No postal codes found, show the municipality
  return filteredMunicipalities;
}

/**
 * Routes result processing based on search type.
 *
 * @param results - The normalized search results.
 * @param searchType - The type of search being performed.
 * @param searchQuery - The original search query.
 * @param effectiveCountrySet - The country set to use.
 * @param getPostalCodes - Function to fetch postal codes for a municipality.
 * @returns Processed results appropriate for the search type.
 */
export async function processResultsBySearchType(
  results: AzureMapsSearchResult[],
  searchType: SearchType,
  searchQuery: string,
  effectiveCountrySet: string | undefined,
  getPostalCodes: PostalCodeFetcher
): Promise<AzureMapsSearchResult[]> {
  switch (searchType) {
    case 'postalcode':
      return processPostalCodeResults(results, searchQuery, effectiveCountrySet, getPostalCodes);
    case 'postalcode-to-city':
      return processPostalCodeToCityResults(results);
    default:
      return processAddressResults(results);
  }
}
