/**
 * Type definitions and type guards for Azure Maps API.
 * @module types
 */

export {
  // Interfaces
  type AzureMapsAddress,
  type AzureMapsPosition,
  type AzureMapsSearchResult,
  type AzureMapsSearchResponse,
  type AzureMapsRawResponse,
  type EntityTypeValue,
  // Type guards
  isAzureMapsPosition,
  isAzureMapsAddress,
  isAzureMapsSearchResult,
  isAzureMapsSearchResponse,
  // Parsing functions
  parseSearchResponse,
  extractValidResults,
  // Constants
  EntityType,
  isKnownEntityType
} from './azureMapsTypes';

export {
  // Dataverse types
  type ErrorSource,
  type DataverseErrorDetail,
  // Dataverse error class
  DataverseApiError,
  // Type guards
  isDataverseApiError,
  hasDataverseErrorProperties
} from './dataverseTypes';

export {
  // Additional parameters types
  type CountryChoice,
  type CountryLookup,
  type CountryTableConfig,
  type CountriesConfig,
  type AzureMapServiceConfigs,
  type AdditionalParameters,
  // Helper functions
  parseAdditionalParameters,
  findCountryChoiceByName,
  findCountryLookupByISO2,
  findCountryLookupByISO3,
  findCountryLookupByName
} from './additionalParametersTypes';
