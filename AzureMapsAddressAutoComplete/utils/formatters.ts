/**
 * Formatting utility functions for Azure Maps Address AutoComplete.
 * @module utils/formatters
 */

import type { AzureMapsSearchResult } from '../services';

/**
 * Formats a score value for display.
 *
 * @param score - The score value from the result (may be unknown type).
 * @returns Formatted score string with bullet prefix, or null if not a valid number.
 *
 * @example
 * ```ts
 * formatScore(0.95) // " • Score: 0.95"
 * formatScore(undefined) // null
 * formatScore("invalid") // null
 * ```
 */
export const formatScore = (score: unknown): string | null => {
  return typeof score === 'number' ? ` • Score: ${score.toFixed(2)}` : null;
};

/**
 * Formats coordinates for display with 6 decimal places.
 *
 * @param latitude - The latitude coordinate.
 * @param longitude - The longitude coordinate.
 * @returns Formatted coordinate string, or null if coordinates are undefined.
 *
 * @example
 * ```ts
 * formatCoordinates(47.6062, -122.3321) // "47.606200, -122.332100"
 * formatCoordinates(undefined, undefined) // null
 * ```
 */
export const formatCoordinates = (
  latitude: number | undefined,
  longitude: number | undefined
): string | null => {
  if (latitude === undefined || longitude === undefined) {
    return null;
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Formats the primary address line for display in dropdown suggestions.
 * Includes country code prefix and postal code if available.
 *
 * @param address - The address object from a search result.
 * @returns Formatted primary address string.
 *
 * @example
 * ```ts
 * formatPrimaryAddress({
 *   countryCode: 'US',
 *   postalCode: '98101',
 *   freeformAddress: '123 Main St, Seattle, WA'
 * })
 * // "[US] 98101 - 123 Main St, Seattle, WA"
 * ```
 */
export const formatPrimaryAddress = (
  address: AzureMapsSearchResult['address']
): string => {
  const parts: string[] = [];

  if (address.countryCode) {
    parts.push(`[${address.countryCode}]`);
  }

  if (address.postalCode) {
    parts.push(`${address.postalCode} -`);
  }

  parts.push(address.freeformAddress);

  return parts.join(' ');
};

/**
 * Formats the secondary address line for display in dropdown suggestions.
 * Includes municipality, subdivision, coordinates, and score.
 *
 * @param address - The address object from a search result.
 * @param score - The optional score value.
 * @param latitude - The optional latitude coordinate.
 * @param longitude - The optional longitude coordinate.
 * @returns Formatted secondary address string.
 *
 * @example
 * ```ts
 * formatSecondaryAddress(
 *   { municipality: 'Seattle', countrySubdivision: 'WA' },
 *   0.95,
 *   47.6062,
 *   -122.3321
 * )
 * // "Seattle, WA • 47.606200, -122.332100 • Score: 0.95"
 * ```
 */
export const formatSecondaryAddress = (
  address: AzureMapsSearchResult['address'],
  score?: unknown,
  latitude?: number,
  longitude?: number
): string => {
  const parts: string[] = [];

  if (address.municipality) {
    parts.push(address.municipality);
  }

  if (address.countrySubdivision) {
    parts.push(address.countrySubdivision);
  }

  if (address.country) {
    parts.push(address.country);
  }

  let result = parts.join(', ');

  const formattedCoords = formatCoordinates(latitude, longitude);
  if (formattedCoords) {
    result += ` • ${formattedCoords}`;
  }

  const formattedScore = formatScore(score);
  if (formattedScore) {
    result += formattedScore;
  }

  return result;
};

/**
 * Formats a country code with brackets.
 *
 * @param countryCode - The ISO country code (e.g., 'US', 'DE').
 * @returns Formatted country code string with brackets, or empty string if not provided.
 *
 * @example
 * ```ts
 * formatCountryCode('US') // "[US] "
 * formatCountryCode(undefined) // ""
 * ```
 */
export const formatCountryCode = (countryCode: string | undefined): string => {
  return countryCode ? `[${countryCode}] ` : '';
};

/**
 * Formats a postal code with dash suffix.
 *
 * @param postalCode - The postal code.
 * @returns Formatted postal code string with dash, or empty string if not provided.
 *
 * @example
 * ```ts
 * formatPostalCode('98101') // "98101 - "
 * formatPostalCode(undefined) // ""
 * ```
 */
export const formatPostalCode = (postalCode: string | undefined): string => {
  return postalCode ? `${postalCode} - ` : '';
};
