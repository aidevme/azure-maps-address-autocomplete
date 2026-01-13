/**
 * Azure Maps API Service
 * Provides typed functions for interacting with Azure Maps Search APIs.
 */

import { isAzureMapsSearchResponse, extractValidResults } from "../../types";

/** Azure Maps Search API base URL. */
const AZURE_MAPS_SEARCH_URL = "https://atlas.microsoft.com/search/address/json";

/** Azure Maps Fuzzy Search API base URL (supports entityType filtering). */
const AZURE_MAPS_FUZZY_SEARCH_URL =
  "https://atlas.microsoft.com/search/fuzzy/json";

/**
 * Azure Maps Search API response result item.
 */
export interface AzureMapsSearchResult {
  type: string;
  id: string;
  /** The relative matching score between results (higher = better match). */
  score?: number;
  entityType?: string;
  address: {
    freeformAddress: string;
    streetNumber?: string;
    streetName?: string;
    municipality?: string;
    municipalitySubdivision?: string;
    neighbourhood?: string;
    countrySubdivision?: string;
    countrySubdivisionName?: string;
    countrySubdivisionCode?: string;
    postalCode?: string;
    extendedPostalCode?: string;
    country?: string;
    countryCode?: string;
    countryCodeISO3?: string;
    localName?: string;
  };
  position: {
    lat: number;
    lon: number;
  };
}

/**
 * Azure Maps Search API response.
 */
export interface AzureMapsSearchResponse {
  results: AzureMapsSearchResult[];
}

/**
 * Search options for Azure Maps API calls.
 */
export interface AzureMapsSearchOptions {
  /** Azure Maps subscription key. */
  subscriptionKey: string;
  /** Search query string. */
  query: string;
  /** Language code for results (e.g., 'en-US'). */
  language?: string;
  /** Comma-separated country codes to filter results. */
  countrySet?: string;
  /** Maximum number of results to return. */
  limit?: number;
  /** Latitude for nearby searches. */
  lat?: number;
  /** Longitude for nearby searches. */
  lon?: number;
  /** Radius in meters for nearby searches. */
  radius?: number;
  /** Entity type filter (e.g., 'Municipality', 'PostalCodeArea'). */
  entityType?: string;
  /** Extended postal codes for specific indexes. */
  extendedPostalCodesFor?: string;
}

/**
 * Additional information for Azure Maps API errors.
 */
export interface AzureMapsErrorAdditionalInfo {
  /** The type of additional information. */
  type?: string;
  /** Additional error information. */
  info?: Record<string, unknown>;
}

/**
 * Detailed error information from Azure Maps API.
 */
export interface AzureMapsErrorDetail {
  /** The error code. */
  code?: string;
  /** The error message. */
  message?: string;
  /** The target of the error (e.g., parameter name). */
  target?: string;
  /** Nested error details. */
  details?: AzureMapsErrorDetail[];
  /** Additional error information. */
  additionalInfo?: AzureMapsErrorAdditionalInfo[];
}

/**
 * Error response structure from Azure Maps API.
 */
export interface AzureMapsErrorResponse {
  /** The error details. */
  error?: AzureMapsErrorDetail;
}

/**
 * Custom error class for Azure Maps API errors.
 * Provides structured error information including code, message, and HTTP status.
 *
 * @example
 * ```ts
 * try {
 *   const results = await searchAddress(options);
 * } catch (error) {
 *   if (error instanceof AzureMapsApiError) {
 *     console.log(`Error ${error.code}: ${error.message}`);
 *     console.log(`HTTP Status: ${error.httpStatus}`);
 *   }
 * }
 * ```
 */
export class AzureMapsApiError extends Error {
  /** The Azure Maps error code. */
  public readonly code: string;
  /** The HTTP status code. */
  public readonly httpStatus: number;
  /** The target of the error (e.g., parameter name). */
  public readonly target?: string;
  /** Nested error details. */
  public readonly details?: AzureMapsErrorDetail[];

  /**
   * Creates a new AzureMapsApiError.
   *
   * @param message - The error message.
   * @param code - The Azure Maps error code.
   * @param httpStatus - The HTTP status code.
   * @param target - The optional target of the error.
   * @param details - Optional nested error details.
   */
  constructor(
    message: string,
    code: string,
    httpStatus: number,
    target?: string,
    details?: AzureMapsErrorDetail[]
  ) {
    super(message);
    this.name = "AzureMapsApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.target = target;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, AzureMapsApiError);
    }
  }

  /**
   * Returns a human-readable description of the error.
   *
   * @returns A formatted error string.
   */
  public toString(): string {
    let result = `AzureMapsApiError [${this.code}] (HTTP ${this.httpStatus}): ${this.message}`;
    if (this.target) {
      result += ` (target: ${this.target})`;
    }
    return result;
  }
}

/**
 * Checks if a value is an AzureMapsErrorResponse.
 *
 * @param value - The value to check.
 * @returns True if the value is an AzureMapsErrorResponse.
 */
function isAzureMapsErrorResponse(
  value: unknown
): value is AzureMapsErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as AzureMapsErrorResponse).error === "object"
  );
}

/**
 * Handles the API response and throws appropriate errors for non-OK responses.
 *
 * @param response - The fetch Response object.
 * @param apiName - The name of the API for error messages.
 * @throws AzureMapsApiError if the response is not OK.
 */
async function handleApiResponse(
  response: Response,
  apiName: string
): Promise<void> {
  if (response.ok) {
    return;
  }

  let errorCode = "UnknownError";
  let errorMessage = `${apiName} error: HTTP ${response.status}`;
  let errorTarget: string | undefined;
  let errorDetails: AzureMapsErrorDetail[] | undefined;

  try {
    const errorBody: unknown = await response.json();

    if (isAzureMapsErrorResponse(errorBody) && errorBody.error) {
      errorCode = errorBody.error.code ?? errorCode;
      errorMessage = errorBody.error.message ?? errorMessage;
      errorTarget = errorBody.error.target;
      errorDetails = errorBody.error.details;
    }
  } catch {
    // If JSON parsing fails, use default error message
  }

  throw new AzureMapsApiError(
    errorMessage,
    errorCode,
    response.status,
    errorTarget,
    errorDetails
  );
}

/**
 * Builds the URL for Azure Maps Search API.
 *
 * @param baseUrl - The base API URL.
 * @param options - The search options.
 * @returns The complete URL with query parameters.
 */
function buildSearchUrl(
  baseUrl: string,
  options: AzureMapsSearchOptions
): string {
  const params = new URLSearchParams();

  params.set("subscription-key", options.subscriptionKey);
  params.set("api-version", "1.0");
  params.set("query", options.query);

  if (options.language) {
    params.set("language", options.language);
  }
  if (options.countrySet) {
    params.set("countrySet", options.countrySet);
  }
  if (options.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options.lat !== undefined && options.lon !== undefined) {
    params.set("lat", options.lat.toString());
    params.set("lon", options.lon.toString());
  }
  if (options.radius) {
    params.set("radius", options.radius.toString());
  }
  if (options.entityType) {
    params.set("entityType", options.entityType);
  }
  if (options.extendedPostalCodesFor) {
    params.set("extendedPostalCodesFor", options.extendedPostalCodesFor);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Searches for addresses using Azure Maps Address Search API.
 *
 * @param options - The search options.
 * @returns Promise resolving to search results.
 * @throws AzureMapsApiError if the API request fails with structured error information.
 *
 * @example
 * ```ts
 * try {
 *   const results = await searchAddress({
 *     subscriptionKey: 'your-key',
 *     query: '1 Microsoft Way, Redmond',
 *     countrySet: 'US'
 *   });
 * } catch (error) {
 *   if (error instanceof AzureMapsApiError) {
 *     if (error.httpStatus === 401) {
 *       console.log('Invalid subscription key');
 *     } else if (error.httpStatus === 429) {
 *       console.log('Rate limit exceeded, please retry later');
 *     }
 *   }
 * }
 * ```
 */
export async function searchAddress(
  options: AzureMapsSearchOptions
): Promise<AzureMapsSearchResult[]> {
  const url = buildSearchUrl(AZURE_MAPS_SEARCH_URL, options);

  const response = await fetch(url);
  await handleApiResponse(response, "Azure Maps Address Search API");

  const data: unknown = await response.json();

  if (!isAzureMapsSearchResponse(data)) {
    console.warn("Azure Maps API returned unexpected response format");
    return [];
  }

  return extractValidResults(data);
}

/**
 * Searches using Azure Maps Fuzzy Search API (supports entity type filtering).
 *
 * @param options - The search options.
 * @returns Promise resolving to search results.
 * @throws AzureMapsApiError if the API request fails with structured error information.
 *
 * @example
 * ```ts
 * try {
 *   const results = await searchFuzzy({
 *     subscriptionKey: 'your-key',
 *     query: 'Seattle',
 *     entityType: 'Municipality'
 *   });
 * } catch (error) {
 *   if (error instanceof AzureMapsApiError) {
 *     console.log(`Error ${error.code}: ${error.message}`);
 *   }
 * }
 * ```
 */
export async function searchFuzzy(
  options: AzureMapsSearchOptions
): Promise<AzureMapsSearchResult[]> {
  const url = buildSearchUrl(AZURE_MAPS_FUZZY_SEARCH_URL, options);

  const response = await fetch(url);
  await handleApiResponse(response, "Azure Maps Fuzzy Search API");

  const data: unknown = await response.json();

  if (!isAzureMapsSearchResponse(data)) {
    console.warn("Azure Maps Fuzzy API returned unexpected response format");
    return [];
  }

  return extractValidResults(data);
}

/**
 * Searches for municipalities using Azure Maps Fuzzy Search API.
 *
 * @param options - The search options (entityType will be set to 'Municipality').
 * @returns Promise resolving to municipality search results.
 */
export async function searchMunicipalities(
  options: Omit<AzureMapsSearchOptions, "entityType">
): Promise<AzureMapsSearchResult[]> {
  return searchFuzzy({
    ...options,
    entityType: "Municipality",
    extendedPostalCodesFor: "Geo",
  });
}

/**
 * Searches for addresses near a specific location.
 *
 * @param options - The search options including lat, lon, and radius.
 * @returns Promise resolving to nearby search results.
 */
export async function searchNearby(
  options: AzureMapsSearchOptions & { lat: number; lon: number; radius: number }
): Promise<AzureMapsSearchResult[]> {
  return searchFuzzy(options);
}

/**
 * Fetches postal codes for a municipality by searching for addresses and extracting unique postal codes.
 *
 * @param subscriptionKey - Azure Maps subscription key.
 * @param municipalityName - The name of the municipality.
 * @param countryCode - The country code to filter results.
 * @param position - The center position of the municipality.
 * @param language - The language code for results.
 * @returns Promise resolving to an array of unique postal codes.
 */
export async function fetchPostalCodesForMunicipality(
  subscriptionKey: string,
  municipalityName: string,
  countryCode: string,
  position: { lat: number; lon: number },
  language = "en-US"
): Promise<string[]> {
  if (!subscriptionKey || !municipalityName) {
    return [];
  }

  const allPostalCodes = new Set<string>();
  const targetMunicipality = municipalityName.toLowerCase().trim();

  /**
   * Checks if a result matches the target municipality.
   */
  const isMatchingMunicipality = (result: AzureMapsSearchResult): boolean => {
    const resultMunicipality =
      result.address.municipality?.toLowerCase().trim() ?? "";
    const resultLocalName =
      result.address.localName?.toLowerCase().trim() ?? "";
    return (
      resultMunicipality === targetMunicipality ||
      resultLocalName === targetMunicipality
    );
  };

  /**
   * Extracts postal codes from a result and adds them to the set.
   */
  const extractPostalCodes = (result: AzureMapsSearchResult): void => {
    if (result.address.postalCode) {
      const codes = result.address.postalCode.split(",").map((c) => c.trim());
      codes.forEach((code) => allPostalCodes.add(code));
    }
  };

  try {
    // Search nearby the municipality center
    const nearbyResults = await searchNearby({
      subscriptionKey,
      query: municipalityName,
      language,
      countrySet: countryCode,
      limit: 100,
      lat: position.lat,
      lon: position.lon,
      radius: 10000,
    });

    for (const result of nearbyResults) {
      if (isMatchingMunicipality(result)) {
        extractPostalCodes(result);
      }
    }

    // Also search for addresses directly in the municipality
    const addressResults = await searchAddress({
      subscriptionKey,
      query: `1 ${municipalityName}`,
      language,
      countrySet: countryCode,
      limit: 100,
    });

    for (const result of addressResults) {
      if (isMatchingMunicipality(result)) {
        extractPostalCodes(result);
      }
    }

    return [...allPostalCodes].sort();
  } catch (error) {
    console.error("Error fetching postal codes:", error);
    return [];
  }
}

/**
 * Normalizes search results by extracting postal codes from various fields.
 *
 * @param results - The raw search results.
 * @returns The normalized results with postal codes populated.
 */
export function normalizeResults(
  results: AzureMapsSearchResult[]
): AzureMapsSearchResult[] {
  return results.map((result) => {
    if (!result.address.postalCode) {
      if (result.address.extendedPostalCode) {
        result.address.postalCode =
          result.address.extendedPostalCode.split(",")[0];
      } else if (
        result.entityType === "PostalCodeArea" &&
        result.address.freeformAddress
      ) {
        const postalMatch = /^(\d{4,6})/.exec(result.address.freeformAddress);
        if (postalMatch) {
          result.address.postalCode = postalMatch[1];
        }
      }
    }
    return result;
  });
}

/**
 * Creates a postal code result from municipality data.
 *
 * @param postalCode - The postal code.
 * @param municipality - The source municipality result.
 * @returns A new result representing the postal code.
 */
export function createPostalCodeResult(
  postalCode: string,
  municipality: AzureMapsSearchResult
): AzureMapsSearchResult {
  return {
    type: "PostalCode",
    id: `postal-${postalCode}`,
    entityType: "PostalCodeArea",
    address: {
      freeformAddress: `${postalCode} ${municipality.address.municipality}`,
      postalCode: postalCode,
      municipality: municipality.address.municipality,
      countrySubdivision: municipality.address.countrySubdivision,
      countrySubdivisionName: municipality.address.countrySubdivisionName,
      countrySubdivisionCode: municipality.address.countrySubdivisionCode,
      country: municipality.address.country,
      countryCode: municipality.address.countryCode,
    },
    position: municipality.position,
  };
}
