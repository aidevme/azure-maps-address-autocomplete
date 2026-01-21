// AzureMapsAddressAutoComplete\services\Metadata\MetadataService.ts
import { IInputs } from "../../generated/ManifestTypes";

export interface IMetadataServiceProps {
  context: ComponentFramework.Context<IInputs>;
}

/**
 * Represents a single option in a global optionset with full metadata.
 */
export interface GlobalOptionSetOption {
  Value: number;
  Label: string;
  Description?: string;
  ExternalValue: string;
  Color: string | null;
}

/**
 * Represents a simplified option for picklist attributes.
 */
export interface PicklistOption {
  value: number;
  label: string;
  description?: string;
  externalValue?: string;
}

/**
 * Service for retrieving Dataverse metadata.
 */
export class MetadataService {
  private readonly context: ComponentFramework.Context<IInputs>;

  constructor(props: IMetadataServiceProps) {
    this.context = props.context;
  }

  /**
   * Retrieves optionset metadata from an entity attribute.
   * This method handles both local and global optionsets.
   * 
   * @param entityName - The logical name of the entity (e.g., "account").
   * @param attributeName - The logical name of the attribute (e.g., "aidevme_address3_countryregion").
   * @returns Promise resolving to an array of picklist options.
   * @throws Error if the fetch fails or attribute is not a picklist.
   * 
   * @example
   * ```ts
   * const options = await metadataService.getOptionSetMetadata('account', 'aidevme_address3_countryregion');
   * console.log(options); // [{ value: 1, label: "United States", description: "...", externalValue: "USA" }, ...]
   * ```
   */
  public async getOptionSetMetadata(
    entityName: string,
    attributeName: string
  ): Promise<PicklistOption[]> {
    console.log(
      `MetadataService: Fetching optionset metadata for '${entityName}.${attributeName}'`
    );
    
    const context = this.context;
    
    const clientUrl = ((context as unknown) as { page: { getClientUrl: () => string } }).page.getClientUrl();
    const url = `${clientUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet,GlobalOptionSet`;

    try {
      const response = await fetch(url, {
        headers: {
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch optionset metadata: ${response.status} ${response.statusText}`
        );
      }

      const metadata = await response.json() as {
        LogicalName: string;
        OptionSet?: {
          Options?: {
            Value: number;
            Label: { UserLocalizedLabel: { Label: string } };
            Description?: { UserLocalizedLabel?: { Label: string } };
            ExternalValue?: string;
          }[];
        };
        GlobalOptionSet?: {
          Options?: {
            Value: number;
            Label: { UserLocalizedLabel: { Label: string } };
            Description?: { UserLocalizedLabel?: { Label: string } };
            ExternalValue?: string;
          }[];
        };
      };

      // Get options from either local or global optionset
      const options = metadata.OptionSet?.Options ?? metadata.GlobalOptionSet?.Options;

      if (!options) {
        throw new Error(
          `No options found for attribute '${attributeName}' on entity '${entityName}'`
        );
      }

      const picklistOptions = options.map((opt) => ({
        value: opt.Value,
        label: opt.Label.UserLocalizedLabel.Label,
        description: opt.Description?.UserLocalizedLabel?.Label,
        externalValue: opt.ExternalValue,
      }));

      console.log(
        `MetadataService: Retrieved ${picklistOptions.length} options for '${entityName}.${attributeName}'`
      );
      console.log(
        `MetadataService: First 5 options:`,
        picklistOptions.slice(0, 5)
      );
      console.log(
        `MetadataService: All options:`,
        picklistOptions
      );

      return picklistOptions;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `MetadataService: Error fetching optionset metadata for '${entityName}.${attributeName}':`,
          error.message
        );
        throw error;
      }
      const errorMessage = String(error);
      console.error(
        `MetadataService: Error fetching optionset metadata for '${entityName}.${attributeName}':`,
        errorMessage
      );
      throw new Error(errorMessage);
    }
  }
}
