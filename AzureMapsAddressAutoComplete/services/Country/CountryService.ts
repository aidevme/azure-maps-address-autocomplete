// AzureMapsAddressAutoComplete\services\Country\CountryService.ts
import { IInputs } from "../../generated/ManifestTypes";

export interface ICountryServiceProps {
  context: ComponentFramework.Context<IInputs>;
}

export interface ICountryItem {
  aidevme_countryId: string;
  aidevme_name: string;
  aidevme_countryiso2code: string;
  aidevme_countryiso3code: string;
}

export interface ICountryRetrieveResponse {
  isSuccess: boolean;
  message?: string;
  errors?: string[];
  result?: ICountryItem;
}

export interface ICountryRetrieveMultipleResponse {
  isSuccess: boolean;
  message?: string;
  errors?: string[];
  result?: ICountryItem[];
}

export class CountryService {
  private readonly context: ComponentFramework.Context<IInputs>;

  constructor(props: ICountryServiceProps) {
    this.context = props.context;
  }

  /**
   * Checks if the control is in design mode.
   */
  private isInDesignMode(): boolean {
    return (
      typeof this.context.mode.allocatedHeight === "number" &&
      this.context.mode.allocatedHeight === -1
    );
  }

  /**
   * Gets a mock country name from ISO2 code for design mode.
   * @param iso2Code - The ISO 3166-1 alpha-2 country code.
   * @returns A mock country name.
   */
  private getMockCountryNameFromISO2(iso2Code: string): string {
    const countryMap: Record<string, string> = {
      CH: "Switzerland",
      US: "United States",
      DE: "Germany",
      FR: "France",
      IT: "Italy",
      GB: "United Kingdom",
      AT: "Austria",
      ES: "Spain",
      NL: "Netherlands",
      BE: "Belgium",
      CA: "Canada",
      AU: "Australia",
      JP: "Japan",
      CN: "China",
      IN: "India",
      BR: "Brazil",
      MX: "Mexico",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      PL: "Poland",
      CZ: "Czech Republic",
      PT: "Portugal",
      GR: "Greece",
      TR: "Turkey",
      RU: "Russia",
      KR: "South Korea",
      TH: "Thailand",
      SG: "Singapore",
      NZ: "New Zealand",
      IE: "Ireland",
      IL: "Israel",
      ZA: "South Africa",
      AR: "Argentina",
      CL: "Chile",
      CO: "Colombia",
      PE: "Peru",
      VE: "Venezuela",
      EG: "Egypt",
      SA: "Saudi Arabia",
      AE: "United Arab Emirates",
      QA: "Qatar",
      KW: "Kuwait",
      MY: "Malaysia",
      ID: "Indonesia",
      PH: "Philippines",
      VN: "Vietnam",
      UA: "Ukraine",
      RO: "Romania",
      HU: "Hungary",
      BG: "Bulgaria",
      HR: "Croatia",
      SK: "Slovakia",
      SI: "Slovenia",
      LT: "Lithuania",
      LV: "Latvia",
      EE: "Estonia",
      IS: "Iceland",
      LU: "Luxembourg",
    };
    return countryMap[iso2Code.toUpperCase()] ?? "Unknown Country";
  }

  /**
   * Gets a mock country name from ISO3 code for design mode.
   * @param iso3Code - The ISO 3166-1 alpha-3 country code.
   * @returns A mock country name.
   */
  private getMockCountryNameFromISO3(iso3Code: string): string {
    const countryMap: Record<string, string> = {
      CHE: "Switzerland",
      USA: "United States",
      DEU: "Germany",
      FRA: "France",
      ITA: "Italy",
      GBR: "United Kingdom",
      AUT: "Austria",
      ESP: "Spain",
      NLD: "Netherlands",
      BEL: "Belgium",
      CAN: "Canada",
      AUS: "Australia",
      JPN: "Japan",
      CHN: "China",
      IND: "India",
      BRA: "Brazil",
      MEX: "Mexico",
      SWE: "Sweden",
      NOR: "Norway",
      DNK: "Denmark",
      FIN: "Finland",
      POL: "Poland",
      CZE: "Czech Republic",
      PRT: "Portugal",
      GRC: "Greece",
      TUR: "Turkey",
      RUS: "Russia",
      KOR: "South Korea",
      THA: "Thailand",
      SGP: "Singapore",
      NZL: "New Zealand",
      IRL: "Ireland",
      ISR: "Israel",
      ZAF: "South Africa",
      ARG: "Argentina",
      CHL: "Chile",
      COL: "Colombia",
      PER: "Peru",
      VEN: "Venezuela",
      EGY: "Egypt",
      SAU: "Saudi Arabia",
      ARE: "United Arab Emirates",
      QAT: "Qatar",
      KWT: "Kuwait",
      MYS: "Malaysia",
      IDN: "Indonesia",
      PHL: "Philippines",
      VNM: "Vietnam",
      UKR: "Ukraine",
      ROU: "Romania",
      HUN: "Hungary",
      BGR: "Bulgaria",
      HRV: "Croatia",
      SVK: "Slovakia",
      SVN: "Slovenia",
      LTU: "Lithuania",
      LVA: "Latvia",
      EST: "Estonia",
      ISL: "Iceland",
      LUX: "Luxembourg",
    };
    return countryMap[iso3Code.toUpperCase()] ?? "Unknown Country";
  }

  public async getCountryByIso2(iso2Code: string): Promise<ComponentFramework.WebApi.Entity | undefined> {
    console.log(`CountryService.getCountryByIso2: Querying for ISO2 code '${iso2Code}'`);
    const result = await this.context.webAPI.retrieveMultipleRecords(
      "aidevme_country",
      `?$select=aidevme_countryid,aidevme_name,aidevme_countryiso2code,aidevme_countryiso3code&$filter=aidevme_countryiso2code eq '${iso2Code}'&$top=1`
    );
    console.log(`CountryService.getCountryByIso2: Found ${result.entities.length} entities`, result.entities);
    return result.entities.length > 0 ? result.entities[0] : undefined;
  }

  public async getCountryByIso3(iso3Code: string): Promise<ComponentFramework.WebApi.Entity | undefined> {
    console.log(`CountryService.getCountryByIso3: Querying for ISO3 code '${iso3Code}'`);
    const result = await this.context.webAPI.retrieveMultipleRecords(
      "aidevme_country",
      `?$select=aidevme_countryid,aidevme_name,aidevme_countryiso2code,aidevme_countryiso3code&$filter=aidevme_countryiso3code eq '${iso3Code}'&$top=1`
    );
    console.log(`CountryService.getCountryByIso3: Found ${result.entities.length} entities`, result.entities);
    return result.entities.length > 0 ? result.entities[0] : undefined;
  }



}