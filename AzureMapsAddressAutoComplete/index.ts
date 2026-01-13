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
} from "./types";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";

/** Unique instance ID for this control */
const instanceId = uuidv4();

export class AzureMapsAddressAutoComplete
  implements ComponentFramework.ReactControl<IInputs, IOutputs>
{
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
  private latitude: number | undefined;
  private longitude: number | undefined;
  private resultScore: number | undefined;
  private additionalParamsConfig: AdditionalParameters | undefined;

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
    container: HTMLDivElement // Add container parameter.
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    this.rootContainer = container; // Save the container reference.
    context.mode.trackContainerResize(true);
    this.currentValue = getStringValue(
      context.parameters.azureMapsAddressSearchAutoComplete
    );
    this.street = getStringValue(context.parameters.street);
    this.city = getStringValue(context.parameters.city);
    this.postalCode = getStringValue(context.parameters.postalCode);
    this.county = getStringValue(context.parameters.county);
    this.stateProvince = getStringValue(context.parameters.stateProvince);
    this.stateProvinceCode = getStringValue(
      context.parameters.stateProvinceCode
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
      context.parameters.additionalParameters?.raw
    );
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   * @returns ReactElement root react element for the control
   */
  public updateView(
    context: ComponentFramework.Context<IInputs>
  ): React.ReactElement {
    const props: IAzureMapsAddressAutoCompleteAppProps = {
      context: context,
      instanceid: instanceId,
      value: getStringValue(
        context.parameters.azureMapsAddressSearchAutoComplete
      ),
      onChange: this.handleChange.bind(this),
      onSelect: this.handleSelect.bind(this),
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
   * Handles address selection from the dropdown.
   * Extracts address components and notifies the framework.
   * @param address - The formatted address string.
   * @param result - The full Azure Maps search result.
   */
  private handleSelect(address: string, result?: AzureMapsSearchResult): void {
    this.currentValue = address;

    if (result) {
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
      this.resultScore =
        typeof scoreValue === "number" ? scoreValue : undefined;
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
        // Find country lookup by ISO2 code, fallback to ISO3 if not found
        let countryLookup = findCountryLookupByISO2(
          this.additionalParamsConfig,
          this.countryCodeISO2
        );
        countryLookup ??= findCountryLookupByISO3(
          this.additionalParamsConfig,
          this.countryCodeISO3
        );
        if (
          countryLookup &&
          this.additionalParamsConfig?.CountriesConfig.CountryTable
        ) {
          countryOutput = {
            id: countryLookup.Id,
            name: countryLookup.Name,
            entityType:
              this.additionalParamsConfig.CountriesConfig.CountryTable
                .TableName,
          };
        } else {
          countryOutput = undefined;
        }
        break;
      }
      case "OptionSet": {
        // Find country choice by name and return numeric value
        const countryChoice = findCountryChoiceByName(
          this.additionalParamsConfig,
          this.country
        );
        countryOutput = countryChoice?.Value;
        break;
      }
      case "SingleLine.Text":
      default:
        countryOutput = this.country;
        break;
    }

    return {
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
      latitude: this.latitude,
      longitude: this.longitude,
      resultScore: this.resultScore,
    };
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    // Add code to cleanup control if necessary
  }
}
