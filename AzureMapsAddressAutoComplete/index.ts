import { IInputs, IOutputs } from "./generated/ManifestTypes";
import {
  AzureMapsAddressAutoCompleteApp,
  IAzureMapsAddressAutoCompleteAppProps,
} from "./AzureMapsAddressAutoCompleteApp";
import { AzureMapsSearchResult } from "./components/AzureMapsAddressAutoComplete";
import { getStringValue, getNumberValue } from "./utils";
import {
  AdditionalParameters,
  parseAdditionalParameters,
  findCountryChoiceByName,
  findCountryLookupByISO2,
  findCountryLookupByISO3,
  CountryLookup,
} from "./types";
import { PcfContextService } from "./services/PcfContext/PcfContextService";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";

/** Unique instance ID for this control */
const instanceId = uuidv4();

export class AzureMapsAddressAutoComplete implements ComponentFramework.ReactControl<
  IInputs,
  IOutputs
> {
  private notifyOutputChanged: () => void;
  private rootContainer: HTMLDivElement;
  private currentValue: string;
  private street: string;
  private city: string;
  private postalCode: string;
  private county: string;
  private stateProvince: string;
  private stateProvinceCode: string;
  private country: string;
  private countryPropertyType: string;
  private countryOutput:
    | string
    | number
    | ComponentFramework.LookupValue
    | undefined;
  private countryCodeISO2: string;
  private countryCodeISO3: string;
  private latitude: number | null | undefined;
  private longitude: number | null | undefined;
  private resultScore: number | null | undefined;
  private additionalParamsConfig: AdditionalParameters | undefined;
  private cachedCountryLookup: CountryLookup | undefined;
  private pcfContextService: PcfContextService | undefined;

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   * @param container The container element for the control.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement, // Add container parameter.
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    this.rootContainer = container; // Save the container reference.
    
    // Ensure container fills available width in Model-Driven Apps (if container exists)
    if (container?.style) {
      container.style.cssText = 'width: 100% !important; min-width: 0 !important; max-width: 100% !important; display: block !important; box-sizing: border-box !important;';
      container.classList.add('pcf-azure-maps-container');
    }
    
    context.mode.trackContainerResize(true);
    this.currentValue = getStringValue(
      context.parameters.azureMapsAddressSearchAutoComplete,
    );
    this.street = getStringValue(context.parameters.street);
    this.city = getStringValue(context.parameters.city);
    this.postalCode = getStringValue(context.parameters.postalCode);
    this.county = getStringValue(context.parameters.county);
    this.stateProvince = getStringValue(context.parameters.stateProvince);
    this.stateProvinceCode = getStringValue(
      context.parameters.stateProvinceCode,
    );
    this.country = getStringValue(context.parameters.country);
    this.countryPropertyType = context.parameters.country.type;
    this.countryCodeISO2 = getStringValue(context.parameters.countryCodeISO2);
    this.countryCodeISO3 = getStringValue(context.parameters.countryCodeISO3);
    this.latitude = getNumberValue(context.parameters.latitude);
    this.longitude = getNumberValue(context.parameters.longitude);
    this.resultScore = getNumberValue(context.parameters.resultScore);

    // Parse additionalParameters JSON
    this.additionalParamsConfig = parseAdditionalParameters(
      context.parameters.additionalParameters?.raw,
    );

    // Initialize services for country lookup
    this.pcfContextService = new PcfContextService({
      context,
      instanceid: instanceId,
      onSelectedValueChange: (value) => {
        this.currentValue = value.address;
        this.notifyOutputChanged();
      },
    });

    // Initialize optionset metadata if country field is OptionSet type
    if (this.countryPropertyType === "OptionSet") {
      // Get the logical name of the country field from the bound attribute
      const countryAttr = context.parameters.country.attributes as
        | { LogicalName?: string }
        | undefined;
      const attributeLogicalName =
        countryAttr?.LogicalName ?? "aidevme_address3_countryregion";

      // Delegate optionset metadata handling to PcfContextService using the new method
      void this.pcfContextService.getOrFetchOptionSetMetadata(
        "country",
        attributeLogicalName,
      );
    }

    console.log("AzureMapsAddressAutoComplete init context:", context);
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   * @returns ReactElement root react element for the control
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>,
  ): React.ReactElement {
    const props: IAzureMapsAddressAutoCompleteAppProps = {
      context: context,
      instanceid: instanceId,
      value: getStringValue(
        context.parameters.azureMapsAddressSearchAutoComplete,
      ),
      onChange: this.handleChange.bind(this),
      onSelect: (address, result) => {
        void this.handleSelect(address, result);
      },
    };
    return React.createElement(AzureMapsAddressAutoCompleteApp, props);
  }

  /**
   * Handles address value changes from the component.
   * @param value - The new address value.
   */
  private handleChange(value: string): void {
    this.currentValue = value;
    this.notifyOutputChanged();
  }

  /**
   * Extracts address fields from Azure Maps search result.
   * @param result - The Azure Maps search result.
   */
  private extractAddressFields(result: AzureMapsSearchResult): void {
    // Build street from street name and street number (European format)
    const streetNumber = result.address.streetNumber ?? "";
    const streetName = result.address.streetName ?? "";
    this.street = `${streetName} ${streetNumber}`.trim();

    // City from municipality or localName
    this.city = result.address.municipality ?? result.address.localName ?? "";

    // Postal code
    this.postalCode = result.address.postalCode ?? "";

    // County from municipalitySubdivision or neighbourhood
    this.county =
      result.address.municipalitySubdivision ??
      result.address.neighbourhood ??
      "";

    // State/Province from countrySubdivisionName or countrySubdivision
    this.stateProvince =
      result.address.countrySubdivisionName ??
      result.address.countrySubdivision ??
      "";

    // State/Province Code
    this.stateProvinceCode = result.address.countrySubdivisionCode ?? "";

    // Country
    this.country = result.address.country ?? "";

    // Country Code ISO2
    this.countryCodeISO2 = result.address.countryCode ?? "";

    // Country Code ISO3
    this.countryCodeISO3 = result.address.countryCodeISO3 ?? "";

    // Coordinates
    this.latitude = result.position?.lat;
    this.longitude = result.position?.lon;

    // Match score - safely extract as number
    const scoreValue: unknown = result.score;
    this.resultScore = typeof scoreValue === "number" ? scoreValue : undefined;
  }

  /**
   * Resolves country output for OptionSet field type.
   * Uses ISO3 code matching with fallback to name matching.
   */
  private resolveCountryForOptionSet(): void {
    const cachedCountryOptions =
      this.pcfContextService?.getCachedOptionSetMetadata("country");
    console.log(
      `handleSelect: Processing OptionSet - cachedOptions available: ${!!cachedCountryOptions}, ISO3: '${this.countryCodeISO3}'`,
    );

    // Find country option by ExternalValue (ISO3 code) if metadata is cached
    if (cachedCountryOptions && this.countryCodeISO3) {
      console.log(
        `handleSelect: Searching ${cachedCountryOptions.length} cached options for ISO3 '${this.countryCodeISO3}'`,
      );

      const matchedOption = cachedCountryOptions.find(
        (opt) => opt.ExternalValue === this.countryCodeISO3,
      );
      this.countryOutput = matchedOption?.Value;
      console.log(
        `handleSelect: Matched country by ISO3 '${this.countryCodeISO3}':`,
        matchedOption
          ? {
              value: matchedOption.Value,
              label: matchedOption.Label,
              externalValue: matchedOption.ExternalValue,
            }
          : "NOT FOUND",
      );
    } else {
      // Fallback to name matching if metadata not available or no ISO3 code
      console.log(
        `handleSelect: Falling back to name matching for '${this.country}' (cachedOptions: ${!!cachedCountryOptions}, ISO3: '${this.countryCodeISO3}')`,
      );
      const countryChoice = findCountryChoiceByName(
        this.additionalParamsConfig,
        this.country,
      );
      this.countryOutput = countryChoice?.Value;
      console.log(
        `handleSelect: Name match result:`,
        countryChoice
          ? { value: countryChoice.Value, label: countryChoice.Label }
          : "NOT FOUND",
      );
    }
  }

  /**
   * Resolves country output for Lookup.Simple field type.
   * Uses ISO2 code with fallback to ISO3 code.
   */
  private async resolveCountryForLookup(): Promise<void> {
    if (!this.countryCodeISO2) {
      this.cachedCountryLookup = undefined;
      return;
    }

    try {
      this.cachedCountryLookup = await findCountryLookupByISO2(
        this.additionalParamsConfig,
        this.countryCodeISO2,
        this.pcfContextService,
      );
      // Fallback to ISO3 if ISO2 lookup failed
      if (!this.cachedCountryLookup && this.countryCodeISO3) {
        this.cachedCountryLookup = await findCountryLookupByISO3(
          this.additionalParamsConfig,
          this.countryCodeISO3,
          this.pcfContextService,
        );
      }
    } catch (error) {
      console.error("Error fetching country lookup:", error);
      this.cachedCountryLookup = undefined;
    }
  }

  /**
   * Resolves country output based on the bound field type.
   */
  private async resolveCountryOutput(): Promise<void> {
    if (this.countryPropertyType === "OptionSet") {
      this.resolveCountryForOptionSet();
    } else if (this.countryPropertyType === "Lookup.Simple") {
      await this.resolveCountryForLookup();
    } else {
      this.cachedCountryLookup = undefined;
    }
  }

  /**
   * Clears all address fields.
   * Used when clearing the address or when no result is selected.
   */
  private clearAllAddressFields(): void {
    console.log("handleSelect: Clearing all address fields");
    this.street = "";
    this.city = "";
    this.postalCode = "";
    this.county = "";
    this.stateProvince = "";
    this.stateProvinceCode = "";
    this.country = "";
    this.countryCodeISO2 = "";
    this.countryCodeISO3 = "";
    this.cachedCountryLookup = undefined;
    this.countryOutput = undefined;
    // Use null instead of undefined to clear bound numeric fields in Dataverse
    this.latitude = null;
    this.longitude = null;
    this.resultScore = null;
  }

  /**
   * Handles address selection from the dropdown.
   * Extracts address components and notifies the framework.
   * @param address - The formatted address string.
   * @param result - The full Azure Maps search result.
   */
  private async handleSelect(
    address: string,
    result?: AzureMapsSearchResult,
  ): Promise<void> {
    console.log("handleSelect called - address:", address, "result:", result);
    this.currentValue = address;

    if (result) {
      this.extractAddressFields(result);
      await this.resolveCountryOutput();
    } else {
      this.clearAllAddressFields();
    }

    this.notifyOutputChanged();
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    // Determine country output based on bound field type
    let countryOutput:
      | string
      | number
      | ComponentFramework.LookupValue
      | undefined;

    switch (this.countryPropertyType) {
      case "Lookup.Simple": {
        // Use cached country lookup data fetched in handleSelect
        if (
          this.cachedCountryLookup &&
          this.additionalParamsConfig?.CountriesConfig.CountryTable
        ) {
          // Validate that the ID is not an empty GUID to prevent Dataverse errors
          const isEmpty = this.cachedCountryLookup.Id === "00000000-0000-0000-0000-000000000000";
          if (isEmpty) {
            console.warn(`getOutputs: Skipping lookup with empty GUID for country '${this.cachedCountryLookup.Name}'`);
            countryOutput = undefined;
          } else {
            countryOutput = {
              id: this.cachedCountryLookup.Id,
              name: this.cachedCountryLookup.Name,
              entityType:
                this.additionalParamsConfig.CountriesConfig.CountryTable
                  .TableName,
            };
            console.log(`getOutputs: Created LookupValue for country:`, {
              id: this.cachedCountryLookup.Id,
              name: this.cachedCountryLookup.Name,
              entityType: this.additionalParamsConfig.CountriesConfig.CountryTable.TableName,
              cachedCountryLookup: this.cachedCountryLookup
            });
          }
        } else {
          countryOutput = undefined;
          console.log(`getOutputs: No cachedCountryLookup or CountryTable config`);
        }
        break;
      }
      case "OptionSet": {
        // Find optionset value by ExternalValue (ISO3 code)
        const cachedCountryOptions =
          this.pcfContextService?.getCachedOptionSetMetadata("country");
        if (cachedCountryOptions && this.countryCodeISO3) {
          const matchedOption = cachedCountryOptions.find(
            (opt) => opt.ExternalValue === this.countryCodeISO3,
          );
          countryOutput = matchedOption?.Value;
        } else {
          // Fallback to cached value if metadata not available or no ISO3 code
          countryOutput = this.countryOutput;
        }
        break;
      }
      case "SingleLine.Text":
      default:
        countryOutput = this.country;
        break;
    }

    const outputs = {
      azureMapsAddressSearchAutoComplete: this.currentValue,
      street: this.street,
      city: this.city,
      postalCode: this.postalCode,
      county: this.county,
      stateProvince: this.stateProvince,
      stateProvinceCode: this.stateProvinceCode,
      country: countryOutput,
      countryCodeISO2: this.countryCodeISO2,
      countryCodeISO3: this.countryCodeISO3,
      // Cast null to satisfy IOutputs type while allowing PCF to clear the field
      latitude: this.latitude as number | undefined,
      longitude: this.longitude as number | undefined,
      resultScore: this.resultScore as number | undefined,
    };

    return outputs;
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
  }
}
