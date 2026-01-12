/**
 * Services barrel file - exports all service modules.
 */

// Azure Maps Service
export {
    searchAddress,
    searchFuzzy,
    searchMunicipalities,
    searchNearby,
    fetchPostalCodesForMunicipality,
    normalizeResults,
    createPostalCodeResult,
    AzureMapsApiError,
} from "./AzureMap/azureMapsService";

export type {
    AzureMapsSearchResult,
    AzureMapsSearchResponse,
    AzureMapsSearchOptions,
    AzureMapsErrorResponse,
    AzureMapsErrorDetail,
    AzureMapsErrorAdditionalInfo,
} from "./AzureMap/azureMapsService";

// PCF Context Service
export { PcfContextService } from "./PcfContext/PcfContextService";
export type { IPcfContextServiceProps } from "./PcfContext/PcfContextService";

// PCF Context Provider & Hook
export { PcfContextProvider, usePcfContext } from "./PcfContext/PcfContext";

// User Setting Service
export { UserSettingService } from "./UserSetting/UserSettingService";
export type {
    IUserSettingServiceProps,
    IUserSettingItem,
    IUserSettingsRetrieveResponse,
} from "./UserSetting/UserSettingService";
