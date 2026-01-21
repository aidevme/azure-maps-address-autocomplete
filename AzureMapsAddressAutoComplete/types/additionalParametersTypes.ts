/**
 * Type definitions for additionalParameters JSON configuration.
 * Used to configure country field mappings for different field types.
 * @module types/additionalParametersTypes
 */

import { PcfContextService } from '../services/PcfContext/PcfContextService';

/**
 * Choice option for OptionSet field type.
 * Maps to Dataverse OptionSet values.
 *
 * @public
 */
export interface CountryChoice {
  /** The numeric value of the option set item. */
  Value: number;
  /** The display label of the country. */
  Label: string;
}

/**
 * Lookup record for Lookup.Simple field type.
 * Contains country data with ISO codes for matching.
 *
 * @public
 */
export interface CountryLookup {
  /** The GUID of the country record in Dataverse. */
  Id: string;
  /** The name of the country. */
  Name: string;
  /** ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE'). */
  CountryISO2: string;
  /** ISO 3166-1 alpha-3 country code (e.g., 'USA', 'DEU'). */
  CountryISO3: string;
}

/**
 * Configuration for querying country table via WebAPI.
 * Used when country field is bound to a Lookup.Simple type.
 *
 * @public
 */
export interface CountryTableConfig {
  /** The logical name of the country table in Dataverse. */
  TableName: string;
  /** The logical name of the country name field. */
  CountryNameField: string;
  /** The logical name of the ISO2 code field. */
  CountryISO2Field: string;
  /** The logical name of the ISO3 code field. */
  CountryISO3Field: string;
}

/**
 * Countries configuration section.
 * Contains all country mapping data for different field types.
 *
 * @public
 */
export interface CountriesConfig {
  /** Array of country choices for OptionSet fields. */
  Choices: CountryChoice[];
  /** Array of country lookup records for Lookup.Simple fields. */
  Lookup: CountryLookup[];
  /** Configuration for country table WebAPI queries. */
  CountryTable: CountryTableConfig;
}

/**
 * Azure Maps service configuration.
 * Reserved for future Azure Maps API configuration options.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AzureMapServiceConfigs {
  // Reserved for future configuration properties
}

/**
 * Root structure for additionalParameters JSON.
 * Parsed from the additionalParameters input property.
 *
 * @example
 * ```typescript
 * const config: AdditionalParameters = JSON.parse(additionalParamsRaw);
 * const choices = config.CountriesConfig.Choices;
 * ```
 *
 * @public
 */
export interface AdditionalParameters {
  /** Azure Maps service configuration. */
  AzureMapServiceConfigs: AzureMapServiceConfigs;
  /** Countries configuration for field type mappings. */
  CountriesConfig: CountriesConfig;
}

/**
 * Parses the additionalParameters JSON string into a typed object.
 *
 * @param jsonString - The raw JSON string from the additionalParameters property.
 * @returns The parsed AdditionalParameters object, or undefined if parsing fails.
 *
 * @example
 * ```typescript
 * const config = parseAdditionalParameters(context.parameters.additionalParameters.raw);
 * if (config) {
 *   const germany = config.CountriesConfig.Lookup.find(c => c.CountryISO2 === 'DE');
 * }
 * ```
 *
 * @public
 */
export function parseAdditionalParameters(jsonString: string | null | undefined): AdditionalParameters | undefined {
  if (!jsonString) {
    return undefined;
  }

  try {
    return JSON.parse(jsonString) as AdditionalParameters;
  } catch (e) {
    console.error('Failed to parse additionalParameters JSON:', e);
    return undefined;
  }
}

/**
 * Finds a country choice by label (country name).
 *
 * @param config - The parsed AdditionalParameters configuration.
 * @param countryName - The country name to search for.
 * @returns The matching CountryChoice, or undefined if not found.
 *
 * @public
 */
export function findCountryChoiceByName(
  config: AdditionalParameters | undefined,
  countryName: string
): CountryChoice | undefined {
  return config?.CountriesConfig.Choices.find(
    c => c.Label.toLowerCase() === countryName.toLowerCase()
  );
}

/**
 * Finds a country lookup by ISO2 code.
 * 
 * Uses PcfContextService to query Dataverse for country data, falling back to
 * in-memory config lookup if no service is provided.
 *
 * @param config - The parsed AdditionalParameters configuration (used as fallback).
 * @param iso2Code - The ISO 3166-1 alpha-2 country code.
 * @param pcfContextService - Optional PcfContextService instance for Dataverse queries.
 * @returns The matching CountryLookup, or undefined if not found.
 *
 * @public
 */
export async function findCountryLookupByISO2(
  config: AdditionalParameters | undefined,
  iso2Code: string,
  pcfContextService?: PcfContextService
): Promise<CountryLookup | undefined> {
  // If PcfContextService is provided, use it to query Dataverse
  if (pcfContextService) {
    const entity = await pcfContextService.getCountryByIso2(iso2Code);
    console.log(`findCountryLookupByISO2: iso2Code='${iso2Code}', entity:`, entity);
    if (entity) {
      const countryLookup = {
        Id: entity.aidevme_countryid as string,
        Name: entity.aidevme_name as string,
        CountryISO2: entity.aidevme_countryiso2code as string,
        CountryISO3: entity.aidevme_countryiso3code as string,
      };
      console.log(`findCountryLookupByISO2: Returning countryLookup:`, countryLookup);
      return countryLookup;
    }
    return undefined;
  }

  // Fallback to in-memory config lookup
  return config?.CountriesConfig.Lookup.find(
    c => c.CountryISO2.toUpperCase() === iso2Code.toUpperCase()
  );
}

/**
 * Finds a country lookup by ISO3 code.
 * 
 * Uses PcfContextService to query Dataverse for country data, falling back to
 * in-memory config lookup if no service is provided.
 *
 * @param config - The parsed AdditionalParameters configuration (used as fallback).
 * @param iso3Code - The ISO 3166-1 alpha-3 country code.
 * @param pcfContextService - Optional PcfContextService instance for Dataverse queries.
 * @returns The matching CountryLookup, or undefined if not found.
 *
 * @public
 */
export async function findCountryLookupByISO3(
  config: AdditionalParameters | undefined,
  iso3Code: string,
  pcfContextService?: PcfContextService
): Promise<CountryLookup | undefined> {
  // If PcfContextService is provided, use it to query Dataverse
  if (pcfContextService) {
    const entity = await pcfContextService.getCountryByIso3(iso3Code);
    console.log(`findCountryLookupByISO3: iso3Code='${iso3Code}', entity:`, entity);
    if (entity) {
      const countryLookup = {
        Id: entity.aidevme_countryid as string,
        Name: entity.aidevme_name as string,
        CountryISO2: entity.aidevme_countryiso2code as string,
        CountryISO3: entity.aidevme_countryiso3code as string,
      };
      console.log(`findCountryLookupByISO3: Returning countryLookup:`, countryLookup);
      return countryLookup;
    }
    return undefined;
  }

  // Fallback to in-memory config lookup
  return config?.CountriesConfig.Lookup.find(
    c => c.CountryISO3.toUpperCase() === iso3Code.toUpperCase()
  );
}

/**
 * Finds a country lookup by name.
 *
 * @param config - The parsed AdditionalParameters configuration.
 * @param countryName - The country name to search for.
 * @returns The matching CountryLookup, or undefined if not found.
 *
 * @public
 */
export function findCountryLookupByName(
  config: AdditionalParameters | undefined,
  countryName: string
): CountryLookup | undefined {
  return config?.CountriesConfig.Lookup.find(
    c => c.Name.toLowerCase() === countryName.toLowerCase()
  );
}
