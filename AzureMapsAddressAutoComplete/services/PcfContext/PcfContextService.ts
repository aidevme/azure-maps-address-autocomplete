import { Theme } from "@fluentui/react-components";
import { IInputs } from "../../generated/ManifestTypes";
import { getTheme } from "../../utils/theme";
import { DEFAULT_LOCALE } from "../../utils/localeUtils";
import {
  UserSettingService,
  IUserSettingsRetrieveResponse,
} from "../UserSetting/UserSettingService";

import countriesData from '../../statics/countries.json';

/**
 * Context info from PCF mode object (not officially typed).
 *
 * @internal
 */
interface ContextInfo {
  /** The logical name of the entity type. */
  entityTypeName: string;
  /** The unique identifier of the entity record. */
  entityId: string;
}

/**
 * Interface for PCF Context Service Properties.
 * Defines the configuration options for initializing the PcfContextService.
 *
 * @public
 */
export interface IPcfContextServiceProps {
  /** The PCF context object providing access to platform APIs. */
  context: ComponentFramework.Context<IInputs>;
  /** Unique instance identifier for the control. */
  instanceid: string;
  /** Callback invoked when the selected address value changes. */
  onSelectedValueChange: (value: { address: string }) => void;
}

/**
 * Service class for handling PCF context operations and utilities.
 *
 * Provides centralized access to PCF platform features, configuration settings,
 * and utility methods for working with PowerApps component framework controls.
 *
 * @example
 * ```typescript
 * const pcfService = new PcfContextService({
 *   context: context,
 *   instanceid: 'my-control-123',
 *   subscriptionKey: 'your-azure-maps-key',
 *   showMaps: true,
 *   onSelectedValueChange: (value) => console.log(value.address)
 * });
 * ```
 *
 * @public
 */
export class PcfContextService {
  /** Unique instance identifier for the control. */
  instanceid: string;
  /** The PCF context object providing access to platform APIs. */
  context: ComponentFramework.Context<IInputs>;
  /** Azure Maps subscription key for API authentication. */
  subscriptionKey: string;
  /** Default value for the address field. */
  defaultValue: string;
  /** Comma-separated list of ISO 3166-1 alpha-2 country codes. */
  defaultCountries: string;
  /** Additional query parameters for Azure Maps API requests. */
  additionalParameters: string;
  /** Whether to display the map panel with address visualization. */
  showMaps: boolean;
  /** Size of the map panel. */
  mapSize: "small" | "medium" | "large";
  /** Whether to use the user's language preference for address suggestions. */
  useUserLanguage: boolean;
  /** The default language for address search results in locale format (e.g., 'en-US', 'de-DE'). */
  defaultLanguage:
    | "af-ZA"
    | "ar"
    | "bg-BG"
    | "ca-ES"
    | "cs-CZ"
    | "da-DK"
    | "de-DE"
    | "el-GR"
    | "en-AU"
    | "en-GB"
    | "en-NZ"
    | "en-US"
    | "es-419"
    | "es-ES"
    | "es-MX"
    | "et-EE"
    | "eu-ES"
    | "fi-FI"
    | "fr-CA"
    | "fr-FR"
    | "gl-ES"
    | "he-IL"
    | "hr-HR"
    | "hu-HU"
    | "id-ID"
    | "it-IT"
    | "kk-KZ"
    | "lt-LT"
    | "lv-LV"
    | "ms-MY"
    | "nb-NO"
    | "nl-BE"
    | "nl-NL"
    | "pl-PL"
    | "pt-BR"
    | "pt-PT"
    | "ro-RO"
    | "ru-RU"
    | "sk-SK"
    | "sl-SI"
    | "sr-Cyrl-RS"
    | "sv-SE"
    | "th-TH"
    | "tr-TR"
    | "uk-UA"
    | "vi-VN"
    | "zh-Hans-CN"
    | "zh-Hant-TW";
  /** User's UI language in locale format (e.g., 'en-US', 'de-DE'). Retrieved from Dataverse user settings. */
  uiLanguage: string;
  /** User's help language in locale format (e.g., 'en-US', 'de-DE'). Retrieved from Dataverse user settings. */
  helpLanguage: string;
  /** Whether the control is disabled. */
  disabled: boolean;
  /** Fluent UI theme for styling components. */
  theme: Theme;
  /** Callback invoked when the selected address value changes. */
  onSelectedValueChange?: (value: { address: string }) => void;
  /** List of all available countries with ISO codes and localized names. */
  countries: Country[];

  /**
   * Constructor to initialize the PCF Context Service.
   *
   * @param props - The properties to initialize the service.
   *
   * @example
   * ```typescript
   * // With full configuration
   * const service = new PcfContextService({
   *   context: context,
   *   instanceid: uuidv4(),
   *   subscriptionKey: 'your-key',
   *   showMaps: true,
   *   defaultCountries: 'US,CA',
   *   onSelectedValueChange: handleChange
   * });
   *
   * // Default initialization (for testing/storybook)
   * const defaultService = new PcfContextService();
   * ```
   */
  constructor(props?: IPcfContextServiceProps) {
    if (props) {
      this.instanceid = props.instanceid;
      this.context = props.context;
      this.onSelectedValueChange = props.onSelectedValueChange;

      // Extract values from context.parameters
      const params = props.context.parameters;
      this.subscriptionKey = params.subscriptionKey?.raw ?? "";
      this.defaultCountries = params.defaultCountries?.raw ?? "";
      this.additionalParameters = "";

      // Extract boolean properties safely (TwoOptionsProperty can be error-typed)
      this.showMaps = params.showMaps?.raw === true;   
      this.useUserLanguage = params.useUserLanguage?.raw === true;

      // Extract defaultLanguage with validation - PCF enum returns numeric LCID values
      const defaultLanguageRaw = params.defaultLanguage?.raw;
      // Handle both number and string representations
      const defaultLanguageNum =
        typeof defaultLanguageRaw === "string"
          ? Number.parseInt(defaultLanguageRaw, 10)
          : defaultLanguageRaw;

      // Map LCID codes to locale strings (from ControlManifest.Input.xml)
      const lcidToLocaleMap: Record<number, typeof this.defaultLanguage> = {
        1078: "af-ZA",
        1025: "ar",
        1026: "bg-BG",
        1027: "ca-ES",
        1029: "cs-CZ",
        1030: "da-DK",
        1031: "de-DE",
        1032: "el-GR",
        3081: "en-AU",
        2057: "en-GB",
        5129: "en-NZ",
        1033: "en-US",
        22538: "es-419",
        3082: "es-ES",
        2058: "es-MX",
        1061: "et-EE",
        1069: "eu-ES",
        1035: "fi-FI",
        3084: "fr-CA",
        1036: "fr-FR",
        1110: "gl-ES",
        1037: "he-IL",
        1050: "hr-HR",
        1038: "hu-HU",
        1057: "id-ID",
        1040: "it-IT",
        1087: "kk-KZ",
        1063: "lt-LT",
        1062: "lv-LV",
        1086: "ms-MY",
        1044: "nb-NO",
        2067: "nl-BE",
        1043: "nl-NL",
        1045: "pl-PL",
        1046: "pt-BR",
        2070: "pt-PT",
        1048: "ro-RO",
        1049: "ru-RU",
        1051: "sk-SK",
        1060: "sl-SI",
        10266: "sr-Cyrl-RS",
        1053: "sv-SE",
        1054: "th-TH",
        1055: "tr-TR",
        1058: "uk-UA",
        1066: "vi-VN",
        2052: "zh-Hans-CN",
        1028: "zh-Hant-TW",
      };

      this.defaultLanguage =
        (defaultLanguageNum !== undefined && lcidToLocaleMap[defaultLanguageNum]) ||
        "en-US";

      // Extract mapSize with validation - PCF enum returns numeric values
      const mapSizeRaw = params.mapSize?.raw;
      // Handle both number and string representations
      const mapSizeNum =
        typeof mapSizeRaw === "string"
          ? Number.parseInt(mapSizeRaw, 10)
          : mapSizeRaw;
      this.mapSize =
        mapSizeNum === 0 ? "small" : mapSizeNum === 2 ? "large" : "medium";     

      // Disabled if control is disabled OR field is secured and not editable
      const fieldSecurity = params.azureMapsAddressSearchAutoComplete.security;
      this.disabled =
        props.context.mode.isControlDisabled ||
        (fieldSecurity?.secured === true && fieldSecurity?.editable === false);       

      // Initialize language settings with defaults, then fetch from user settings
      this.uiLanguage = DEFAULT_LOCALE;
      this.helpLanguage = DEFAULT_LOCALE;

      // Initialize countries list
      this.countries = getAllCountries();

      console.log(
        "PcfContextService constructor: useUserLanguage =",
        this.useUserLanguage
      );
    } else {
      // Default initialization if props are not provided
      this.theme = getTheme("WebLight");
      this.subscriptionKey = "";
      this.defaultValue = "";
      this.defaultCountries = "";
      this.additionalParameters = "";
      this.showMaps = false;
      this.mapSize = "medium";
      this.disabled = false;
      this.useUserLanguage = false;
      this.defaultLanguage = DEFAULT_LOCALE;
      this.uiLanguage = DEFAULT_LOCALE;
      this.helpLanguage = DEFAULT_LOCALE;
      this.countries = getAllCountries();
    }
  }

  /**
   * Initializes the service asynchronously.
   *
   * This method must be called after constructing the service to complete
   * async initialization tasks such as loading user language settings.
   *
   * @returns Promise that resolves when initialization is complete
   *
   * @remarks
   * Call this method from the PCF `init()` or `updateView()` lifecycle methods.
   * If `useUserLanguage` is disabled, this method returns immediately.
   *
   * @example
   * ```typescript
   * const service = new PcfContextService(props);
   * await service.initialize();
   * ```
   *
   * @public
   */
  public async initialize(): Promise<void> {
    if (this.useUserLanguage) {
      console.log(
        "PcfContextService.initialize: Loading user language settings..."
      );
      await this.initUserLanguageSettings();
    }
  }

  /**
   * Initializes user language settings from Dataverse.
   *
   * Fetches the user's UI and help language preferences and updates
   * the corresponding properties. Called by `initialize()` method
   * if `useUserLanguage` is enabled.
   *
   * @returns Promise that resolves when language settings are loaded
   *
   * @remarks
   * If fetching fails, the default locale (en-US) is retained.
   *
   * @internal
   */
  private async initUserLanguageSettings(): Promise<void> {
    console.log(
      "initUserLanguageSettings: Starting to load user language settings..."
    );
    try {
      const settings = await this.getUserSettings();
      console.log(
        "initUserLanguageSettings: User settings response:",
        settings
      );
      if (settings.isSuccess && settings.result) {
        this.uiLanguage = settings.result.uilanguage;
        this.helpLanguage = settings.result.helplanguage;
        console.log(
          "initUserLanguageSettings: Loaded - uiLanguage:",
          this.uiLanguage,
          "helpLanguage:",
          this.helpLanguage
        );
      }
    } catch (error) {
      // Log the error and re-throw so it can be handled by the calling component
      console.warn(
        "initUserLanguageSettings: Failed to load user language settings:",
        error
      );
      throw error;
    }
  }

  /**
   * Handles selection changes by invoking the provided callback.
   *
   * @param selectedValue - The selected value object containing the address string.
   *
   * @remarks
   * If no `onSelectedValueChange` callback was provided during initialization,
   * a warning will be logged to the console.
   *
   * @example
   * ```typescript
   * pcfService.handleSelectionChange({ address: '123 Main St, Seattle, WA' });
   * ```
   *
   * @public
   */
  handleSelectionChange(selectedValue: { address: string }): void {
    if (this.onSelectedValueChange) {
      this.onSelectedValueChange(selectedValue);
    } else {
      console.warn("No onSelectedValueChange callback defined.");
    }
  }

  /**
   * Determines if the control is currently running in design mode.
   *
   * Design mode occurs when the control is being configured in the PowerApps
   * maker portal or similar design-time environments. This is useful for
   * providing different behavior or mock data during development.
   *
   * @returns True if running in design mode, false if in runtime mode
   *
   * @remarks
   * Supports detection across multiple Microsoft cloud environments:
   * - Commercial cloud (make.powerapps.com)
   * - Government Community Cloud (make.gov.powerapps.us)
   * - GCC High (make.high.powerapps.us)
   * - Department of Defense (make.apps.appsplatform.us)
   * - Local development (localhost)
   *
   * @example
   * ```typescript
   * if (pcfService.inDesignMode()) {
   *   // Show design-time placeholder or mock data
   *   return <DesignTimePlaceholder />;
   * }
   * ```
   *
   * @public
   */
  // public inDesignMode(): boolean {
  //   // Previously only handled commercial cloud.
  //   // Updated to also handle GCC, GCC High, and DoD maker portal URLs.
  //   const designModeUrls = [
  //     "make.powerapps.com",
  //     "make.gov.powerapps.us", // GCC
  //     "make.high.powerapps.us", // GCC High
  //     "make.apps.appsplatform.us", // DoD
  //     "localhost", // localhost for testing
  //   ];
  //   const currentUrl = window.location.href;
  //   return designModeUrls.some((url) => currentUrl.includes(url));
  // }

  /**
   * Static method to determine if the control is currently running in design mode.
   *
   * This is a utility method that doesn't require creating an instance of PcfContextService.
   * Design mode occurs when the control is being configured in the PowerApps
   * maker portal or similar design-time environments.
   *
   * @param context - The PCF context (not actually used but kept for API consistency)
   * @returns True if running in design mode, false if in runtime mode
   *
   * @remarks
   * Supports detection across multiple Microsoft cloud environments:
   * - Commercial cloud (make.powerapps.com)
   * - Government Community Cloud (make.gov.powerapps.us)
   * - GCC High (make.high.powerapps.us)
   * - Department of Defense (make.apps.appsplatform.us)
   * - Local development (localhost)
   *
   * @example
   * ```typescript
   * const isDesignMode = PcfContextService.isInDesignMode(context);
   * if (isDesignMode) {
   *   // Show design-time placeholder or mock data
   *   return <DesignTimePlaceholder />;
   * }
   * ```
   *
   * @public
   */
  public static isInDesignMode(
    context?: ComponentFramework.Context<IInputs>
  ): boolean {
    // Previously only handled commercial cloud.
    // Updated to also handle GCC, GCC High, and DoD maker portal URLs.
    const designModeUrls = [
      "make.powerapps.com",
      "make.gov.powerapps.us", // GCC
      "make.high.powerapps.us", // GCC High
      "make.apps.appsplatform.us", // DoD
      "localhost", // localhost for testing
    ];
    const currentUrl = globalThis.location.href;
    return designModeUrls.some((url) => currentUrl.includes(url));
  }

  public isCanvasApp(): boolean {
    return this.context.mode.allocatedHeight !== -1;
  }

  /**
   * Gets the allocated width for the control from the PCF context.
   * Returns -1 if not available (e.g., in model-driven apps where width is determined by form layout).
   *
   * @returns The allocated width in pixels, or -1 if not specified
   */
  public get allocatedWidth(): number {
    return this.context?.mode?.allocatedWidth ?? -1;
  }

  /**
   * Checks if the control is currently in a disabled state.
   *
   * This reflects the control's disabled state as determined by the PowerApps
   * platform, which can be influenced by form rules, security permissions,
   * or explicit configuration.
   *
   * @returns True if the control is disabled, false if enabled
   *
   * @remarks
   * Use this to conditionally render UI elements or prevent user interactions
   * when the control should not accept input.
   *
   * @example
   * ```typescript
   * const isReadOnly = pcfService.isControlDisabled();
   * <Button disabled={isReadOnly}>Save</Button>
   * ```
   *
   * @public
   */
  public isControlDisabled(): boolean {
    // Return the control's disabled state from the context
    return this.context.mode.isControlDisabled;
  }

  public isVisible(): boolean {
    return this.context.mode.isVisible;
  }
  /**
   * Gets the logical name of the current entity type.
   *
   * This provides the schema name of the entity (table) that the control
   * is currently associated with, useful for entity-specific logic.
   *
   * @returns The entity type name (e.g., "account", "contact", "lead")
   *
   * @remarks
   * The entity type name corresponds to the logical name used in the
   * Dataverse schema and can be used for API calls or conditional logic.
   *
   * @example
   * ```typescript
   * const entityType = pcfService.getEntityTypeName();
   * if (entityType === 'lead') {
   *   // Show lead-specific functionality
   * }
   * ```
   *
   * @public
   */
  public getEntityTypeName(): string {
    const contextInfo = (
      this.context.mode as unknown as { contextInfo: ContextInfo }
    ).contextInfo;
    return contextInfo.entityTypeName;
  }

  /**
   * Gets the unique identifier of the current entity record.
   *
   * This provides the GUID of the specific record that the control
   * is currently associated with.
   *
   * @returns The entity record ID as a string GUID
   *
   * @remarks
   * The entity ID is essential for making Web API calls to retrieve
   * or update the current record's data.
   *
   * @example
   * ```typescript
   * const recordId = pcfService.getEntityId();
   * const apiUrl = `/api/data/v9.2/leads(${recordId})`;
   * ```
   *
   * @public
   */
  public getEntityId(): string {
    const contextInfo = (
      this.context.mode as unknown as { contextInfo: ContextInfo }
    ).contextInfo;
    return contextInfo.entityId;
  }

  /**
   * Gets the unique identifier of the current user.
   *
   * Returns the user ID with curly braces removed for easier use
   * in API calls and data operations.
   *
   * @returns The current user's ID as a clean GUID string
   *
   * @remarks
   * The user ID is cleaned of surrounding curly braces for consistency
   * with typical GUID usage patterns in API calls.
   *
   * @example
   * ```typescript
   * const userId = pcfService.getUserId();
   * const userApiUrl = `/api/data/v9.2/systemusers(${userId})`;
   * ```
   *
   * @public
   */
  public getUserId(): string {
    return this.context.userSettings.userId.replace("{", "").replace("}", "");
  }

  /**
   * Gets a localized string from the control's resource file (.resx).
   *
   * Retrieves translated strings based on the user's language settings.
   * Falls back to the provided default value if the context or resource is unavailable.
   *
   * @param key - The resource key defined in the .resx file (e.g., "addressInputPlaceholder_Key")
   * @param defaultValue - The fallback value to return if the resource is unavailable
   * @returns The localized string or the default value
   *
   * @example
   * ```typescript
   * const placeholder = pcfService.getString('addressInputPlaceholder_Key', 'Enter an address...');
   * ```
   *
   * @public
   */
  public getString(key: string, defaultValue: string): string {
    if (this.context?.resources?.getString) {
      try {
        return this.context.resources.getString(key) || defaultValue;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  /**
   * Gets the current user's settings from Dataverse.
   *
   * Retrieves user preferences including UI and help language settings.
   *
   * @returns Promise with user settings including language preferences
   *
   * @example
   * ```typescript
   * const settings = await pcfService.getUserSettings();
   * if (settings.isSuccess && settings.result) {
   *   const languageId = settings.result.uilanguageid; // e.g., 1033 for English
   * }
   * ```
   *
   * @public
   */
  public async getUserSettings(): Promise<IUserSettingsRetrieveResponse> {
    const userSettingService = new UserSettingService({
      pcfContextService: this,
    });
    return userSettingService.getUserSettings(this.getUserId());
  }
}

/**
 * Represents a country with ISO codes and localized names.
 *
 * @public
 */
export interface Country {
  /** The country name in English. */
  Country: string;
  /** ISO 3166-1 alpha-2 country code (e.g., 'US', 'DE'). */
  CountryISO2: string;
  /** ISO 3166-1 alpha-3 country code (e.g., 'USA', 'DEU'). */
  CountryISO3: string;
  /** Localized country names keyed by LCID. */
  LocalizedCountryName: Record<string, string>;
}

/**
 * Returns the list of all available countries.
 *
 * @returns An array of Country objects with ISO codes and localized names.
 *
 * @example
 * ```typescript
 * const countries = getAllCountries();
 * // [{ Country: "Afghanistan", CountryISO2: "AF", CountryISO3: "AFG", ... }, ...]
 * ```
 *
 * @public
 */
export const getAllCountries = (): Country[] => {
  return countriesData as Country[];
};
