/**
 * Utility functions for Azure Maps Address AutoComplete.
 * @module utils
 */

export {
  MIN_CHARS_FOR_SUGGESTIONS,
  DEBOUNCE_DELAY,
  parseSearchPattern,
  buildApiQuery,
  filterMunicipalitiesBySearchQuery,
  processPostalCodeToCityResults,
  processAddressResults,
  processPostalCodeResults,
  processResultsBySearchType
} from './searchPatternUtils';

export type { SearchType, SearchPatternResult, PostalCodeFetcher } from './searchPatternUtils';

export {
  formatScore,
  formatCoordinates,
  formatPrimaryAddress,
  formatSecondaryAddress,
  formatCountryCode,
  formatPostalCode,
  //convertIso2ToIso3
} from './formatters';

export {
  DEFAULT_LOCALE,
  LCID_TO_LOCALE,
  lcidToLocale,
  hasLocaleMapping
} from './localeUtils';

export { Icons } from './iconRegistry';

export {
  getStringValue,
  getNumberValue,
  getBooleanValue,
  getMapSizeValue
} from './pcfPropertyHelpers';

export type { MapSize } from './pcfPropertyHelpers';

export { getTheme } from './theme';

export {
  loadAzureMapsSdk,
  getAtlas,
  isAzureMapsSdkLoaded
} from './azureMapsSdkLoader';
