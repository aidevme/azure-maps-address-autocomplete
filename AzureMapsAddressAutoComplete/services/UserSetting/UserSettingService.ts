// AzureMapsAddressAutoComplete\services\UserSetting\UserSettingService.ts
import { PcfContextService } from "../PcfContext/PcfContextService";
import { DEFAULT_LOCALE, lcidToLocale, hasLocaleMapping } from "../../utils/localeUtils";
import { USER_SETTING_MESSAGES } from "../../constants/messages";
import { DataverseApiError } from "../../types";

/**
 * Cache entry for user settings with expiration.
 */
interface CacheEntry {
  data: IUserSettingItem;
  expiresAt: number;
}

/**
 * Cache expiration time in milliseconds (5 minutes).
 */
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Static cache for user settings to avoid repeated API calls.
 */
const userSettingsCache = new Map<string, CacheEntry>();

export interface IUserSettingServiceProps {
  pcfContextService: PcfContextService;
}

export interface IUserSettingItem {
  systemuserid: string;
  uilanguageid: number;
  helplanguageid: number;
  /** UI language in locale format (e.g., 'en-US', 'de-DE'). */
  uilanguage: string;
  /** Help language in locale format (e.g., 'en-US', 'de-DE'). */
  helplanguage: string;
}

export interface IUserSettingsRetrieveResponse {
  isSuccess: boolean;
  message?: string;
  errors?: string[];
  result?: IUserSettingItem;
}

export class UserSettingService {
  private readonly pcfContextService: PcfContextService;

  constructor(props: IUserSettingServiceProps) {
    this.pcfContextService = props.pcfContextService;
  }

  /**
   * Retrieves user settings from Dataverse or cache.
   *
   * @param userId - The user ID to retrieve settings for
   * @returns Promise with user settings including language preferences
   *
   * @remarks
   * Results are cached for 5 minutes to reduce API calls.
   * In design mode, returns mock data with English (US) locale.
   *
   * @example
   * ```typescript
   * const response = await userSettingService.getUserSettings(userId);
   * if (response.isSuccess && response.result) {
   *   console.log(response.result.uilanguage); // e.g., "de-DE"
   * }
   * ```
   *
   * @public
   */
  public async getUserSettings(userId: string): Promise<IUserSettingsRetrieveResponse> {
    // Check design mode using static method
    if (PcfContextService.isInDesignMode(this.pcfContextService.context)) {
      return {
        isSuccess: true,
        result: {
          systemuserid: userId,
          uilanguageid: 1033,
          helplanguageid: 1033,
          uilanguage: DEFAULT_LOCALE,
          helplanguage: DEFAULT_LOCALE,
        },
      };
    }

    // Check cache first
    const cached = this.getFromCache(userId);
    if (cached) {
      return {
        isSuccess: true,
        result: cached,
      };
    }

    try {
      const entityName = "usersettings";
      const query = "?$select=systemuserid,helplanguageid,uilanguageid";
      const result = await this.pcfContextService.context.webAPI.retrieveRecord(
        entityName,
        userId,
        query
      );

      const uilanguageid = result.uilanguageid as number;
      const helplanguageid = result.helplanguageid as number;

      if (!result.systemuserid) {
        return {
          isSuccess: false,
          message: `${USER_SETTING_MESSAGES.USER_SETTINGS_NOT_FOUND} ${userId}`,
          errors: [`${USER_SETTING_MESSAGES.USER_SETTINGS_NOT_FOUND} ${userId}`],
        };
      }

      const uilanguage = lcidToLocale(uilanguageid);
      const helplanguage = lcidToLocale(helplanguageid);

      // Check if any locale fell back to default
      const fallbackMessages: string[] = [];
      if (!hasLocaleMapping(uilanguageid)) {
        fallbackMessages.push(`${USER_SETTING_MESSAGES.UI_LANGUAGE_LCID_NOT_FOUND} ${DEFAULT_LOCALE} (LCID: ${uilanguageid})`);
      }
      if (!hasLocaleMapping(helplanguageid)) {
        fallbackMessages.push(`${USER_SETTING_MESSAGES.HELP_LANGUAGE_LCID_NOT_FOUND} ${DEFAULT_LOCALE} (LCID: ${helplanguageid})`);
      }

      const userSettingItem: IUserSettingItem = {
        systemuserid: result.systemuserid as string,
        uilanguageid,
        helplanguageid,
        uilanguage,
        helplanguage,
      };

      // Cache the result
      this.setCache(userId, userSettingItem);

      return {
        isSuccess: true,
        message: fallbackMessages.length > 0 ? fallbackMessages.join("; ") : undefined,
        result: userSettingItem,
      };
    } catch (error: unknown) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = USER_SETTING_MESSAGES.UNKNOWN_ERROR_RETRIEVING_USER_SETTINGS;
      }
      
      // Re-throw as DataverseApiError for proper error handling in the dialog
      throw new DataverseApiError(
        errorMessage,
        "DataverseError",
        500,
        undefined,
        "usersettings"
      );
    }
  }

  /**
   * Clears the user settings cache.
   *
   * @param userId - Optional user ID to clear specific entry. If not provided, clears all cache.
   *
   * @public
   */
  public static clearCache(userId?: string): void {
    if (userId) {
      userSettingsCache.delete(userId);
    } else {
      userSettingsCache.clear();
    }
  }

  /**
   * Gets cached user settings if available and not expired.
   */
  private getFromCache(userId: string): IUserSettingItem | null {
    const entry = userSettingsCache.get(userId);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    // Remove expired entry
    if (entry) {
      userSettingsCache.delete(userId);
    }
    return null;
  }

  /**
   * Stores user settings in cache with expiration.
   */
  private setCache(userId: string, data: IUserSettingItem): void {
    userSettingsCache.set(userId, {
      data,
      expiresAt: Date.now() + CACHE_EXPIRATION_MS,
    });
  }
}
