/**
 * Type definitions and type guards for Azure Maps API responses.
 * Provides runtime type safety for API interactions.
 * @module types
 */

/**
 * Address structure from Azure Maps API.
 */
export interface AzureMapsAddress {
  /** The complete, formatted address line. */
  freeformAddress: string;
  /** The street number (e.g., '123'). */
  streetNumber?: string;
  /** The street name (e.g., 'Main Street'). */
  streetName?: string;
  /** The municipality/city name. */
  municipality?: string;
  /** A sub-division of the municipality. */
  municipalitySubdivision?: string;
  /** The neighborhood name. */
  neighbourhood?: string;
  /** The state/province/region code. */
  countrySubdivision?: string;
  /** The full name of the state/province/region. */
  countrySubdivisionName?: string;
  /** The ISO code for the state/province/region. */
  countrySubdivisionCode?: string;
  /** The postal/ZIP code. */
  postalCode?: string;
  /** Extended postal code with more precision. */
  extendedPostalCode?: string;
  /** The country name. */
  country?: string;
  /** The ISO 3166-1 alpha-2 country code (e.g., 'US', 'HU'). */
  countryCode?: string;
  /** The ISO 3166-1 alpha-3 country code (e.g., 'USA', 'HUN'). */
  countryCodeISO3?: string;
  /** The local name of the area. */
  localName?: string;
}

/**
 * Geographic position coordinates.
 */
export interface AzureMapsPosition {
  /** Latitude in degrees (-90 to 90). */
  lat: number;
  /** Longitude in degrees (-180 to 180). */
  lon: number;
}

/**
 * A single search result from Azure Maps API.
 */
export interface AzureMapsSearchResult {
  /** The type of result (e.g., 'Street', 'Point Address'). */
  type: string;
  /** Unique identifier for the result. */
  id: string;
  /** The relative matching score (higher = better match). */
  score?: number;
  /** The entity type (e.g., 'Municipality', 'PostalCodeArea'). */
  entityType?: string;
  /** The address information. */
  address: AzureMapsAddress;
  /** The geographic position. */
  position: AzureMapsPosition;
}

/**
 * Response structure from Azure Maps Search API.
 */
export interface AzureMapsSearchResponse {
  /** The summary of the search request. */
  summary?: {
    /** The original query string. */
    query?: string;
    /** The type of query. */
    queryType?: string;
    /** Time taken to process the query in milliseconds. */
    queryTime?: number;
    /** Number of results returned. */
    numResults?: number;
    /** Offset for pagination. */
    offset?: number;
    /** Total number of results available. */
    totalResults?: number;
    /** Maximum fuzzy matching level used. */
    fuzzyLevel?: number;
  };
  /** The array of search results. */
  results: AzureMapsSearchResult[];
}

/**
 * Raw API response before validation.
 */
export type AzureMapsRawResponse = unknown;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a value is a valid AzureMapsPosition.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid position object.
 *
 * @example
 * ```ts
 * const data = await response.json();
 * if (isAzureMapsPosition(data.position)) {
 *   console.log(`Lat: ${data.position.lat}, Lon: ${data.position.lon}`);
 * }
 * ```
 */
export function isAzureMapsPosition(value: unknown): value is AzureMapsPosition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lon' in value &&
    typeof (value as AzureMapsPosition).lat === 'number' &&
    typeof (value as AzureMapsPosition).lon === 'number'
  );
}

/**
 * Checks if a value is a valid AzureMapsAddress.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid address object.
 *
 * @example
 * ```ts
 * if (isAzureMapsAddress(result.address)) {
 *   console.log(result.address.freeformAddress);
 * }
 * ```
 */
export function isAzureMapsAddress(value: unknown): value is AzureMapsAddress {
  return (
    typeof value === 'object' &&
    value !== null &&
    'freeformAddress' in value &&
    typeof (value as AzureMapsAddress).freeformAddress === 'string'
  );
}

/**
 * Checks if a value is a valid AzureMapsSearchResult.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid search result.
 *
 * @example
 * ```ts
 * const results = data.results.filter(isAzureMapsSearchResult);
 * ```
 */
export function isAzureMapsSearchResult(value: unknown): value is AzureMapsSearchResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const result = value as Partial<AzureMapsSearchResult>;

  return (
    typeof result.type === 'string' &&
    typeof result.id === 'string' &&
    isAzureMapsAddress(result.address) &&
    isAzureMapsPosition(result.position)
  );
}

/**
 * Checks if a value is a valid AzureMapsSearchResponse.
 *
 * @param value - The value to check.
 * @returns True if the value is a valid search response.
 *
 * @example
 * ```ts
 * const data = await response.json();
 * if (isAzureMapsSearchResponse(data)) {
 *   processResults(data.results);
 * }
 * ```
 */
export function isAzureMapsSearchResponse(value: unknown): value is AzureMapsSearchResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'results' in value &&
    Array.isArray((value as AzureMapsSearchResponse).results)
  );
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Safely parses an API response and validates it as AzureMapsSearchResponse.
 *
 * @param data - The raw response data.
 * @returns The validated response or null if invalid.
 *
 * @example
 * ```ts
 * const rawData = await response.json();
 * const parsed = parseSearchResponse(rawData);
 * if (parsed) {
 *   return parsed.results;
 * }
 * ```
 */
export function parseSearchResponse(data: unknown): AzureMapsSearchResponse | null {
  if (!isAzureMapsSearchResponse(data)) {
    return null;
  }

  // Filter to only valid results
  const validResults = data.results.filter(isAzureMapsSearchResult);

  return {
    ...data,
    results: validResults
  };
}

/**
 * Extracts valid results from a raw API response.
 * Returns empty array if the response is invalid.
 *
 * @param data - The raw response data.
 * @returns Array of validated search results.
 *
 * @example
 * ```ts
 * const response = await fetch(url);
 * const data = await response.json();
 * const results = extractValidResults(data);
 * ```
 */
export function extractValidResults(data: unknown): AzureMapsSearchResult[] {
  const parsed = parseSearchResponse(data);
  return parsed?.results ?? [];
}

// ============================================================================
// Entity Type Constants
// ============================================================================

/**
 * Known entity types from Azure Maps API.
 */
export const EntityType = {
  /** A country or region. */
  Country: 'Country',
  /** A state, province, or region. */
  CountrySubdivision: 'CountrySubdivision',
  /** A secondary administrative division. */
  CountrySecondarySubdivision: 'CountrySecondarySubdivision',
  /** A third-level administrative division. */
  CountryTertiarySubdivision: 'CountryTertiarySubdivision',
  /** A city or town. */
  Municipality: 'Municipality',
  /** A district or borough within a city. */
  MunicipalitySubdivision: 'MunicipalitySubdivision',
  /** A neighborhood. */
  Neighbourhood: 'Neighbourhood',
  /** A postal code area. */
  PostalCodeArea: 'PostalCodeArea'
} as const;

/**
 * Type representing valid entity types.
 */
export type EntityTypeValue = typeof EntityType[keyof typeof EntityType];

/**
 * Checks if a string is a known entity type.
 *
 * @param value - The value to check.
 * @returns True if the value is a known entity type.
 */
export function isKnownEntityType(value: string): value is EntityTypeValue {
  return Object.values(EntityType).includes(value as EntityTypeValue);
}
