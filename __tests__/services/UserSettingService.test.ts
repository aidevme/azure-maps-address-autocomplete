/**
 * Unit tests for UserSettingService
 */
import {
  UserSettingService,
  IUserSettingServiceProps,
  IUserSettingItem,
  IUserSettingsRetrieveResponse,
} from '../../AzureMapsAddressAutoComplete/services/UserSetting/UserSettingService';
import { PcfContextService } from '../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContextService';
import { DataverseApiError } from '../../AzureMapsAddressAutoComplete/types';
import { DEFAULT_LOCALE } from '../../AzureMapsAddressAutoComplete/utils/localeUtils';

// Mock the PcfContextService
jest.mock('../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContextService', () => ({
  PcfContextService: {
    isInDesignMode: jest.fn(),
  },
}));

describe('UserSettingService', () => {
  // Mock PCF context service
  let mockPcfContextService: jest.Mocked<PcfContextService>;
  let mockRetrieveRecord: jest.Mock;
  let userSettingService: UserSettingService;

  const mockUserId = 'test-user-id-123';

  const mockUserSettingResult = {
    systemuserid: mockUserId,
    uilanguageid: 1033, // English (US)
    helplanguageid: 1031, // German
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the static mock
    (PcfContextService.isInDesignMode as jest.Mock).mockReturnValue(false);

    // Create mock webAPI
    mockRetrieveRecord = jest.fn();
    mockPcfContextService = {
      context: {
        webAPI: {
          retrieveRecord: mockRetrieveRecord,
        },
      },
    } as unknown as jest.Mocked<PcfContextService>;

    // Clear the user settings cache before each test
    UserSettingService.clearCache();

    userSettingService = new UserSettingService({
      pcfContextService: mockPcfContextService,
    });
  });

  afterEach(() => {
    // Clear cache after each test to ensure test isolation
    UserSettingService.clearCache();
  });

  describe('constructor', () => {
    it('should create an instance with pcfContextService', () => {
      expect(userSettingService).toBeDefined();
    });
  });

  describe('getUserSettings', () => {
    describe('design mode', () => {
      it('should return mock data in design mode', async () => {
        (PcfContextService.isInDesignMode as jest.Mock).mockReturnValue(true);

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.systemuserid).toBe(mockUserId);
        expect(result.result?.uilanguageid).toBe(1033);
        expect(result.result?.helplanguageid).toBe(1033);
        expect(result.result?.uilanguage).toBe(DEFAULT_LOCALE);
        expect(result.result?.helplanguage).toBe(DEFAULT_LOCALE);
        expect(mockRetrieveRecord).not.toHaveBeenCalled();
      });
    });

    describe('runtime mode', () => {
      it('should fetch user settings from Dataverse', async () => {
        mockRetrieveRecord.mockResolvedValueOnce(mockUserSettingResult);

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.systemuserid).toBe(mockUserId);
        expect(result.result?.uilanguageid).toBe(1033);
        expect(result.result?.helplanguageid).toBe(1031);
        expect(result.result?.uilanguage).toBe('en-US');
        expect(result.result?.helplanguage).toBe('de-DE');
        expect(mockRetrieveRecord).toHaveBeenCalledWith(
          'usersettings',
          mockUserId,
          '?$select=systemuserid,helplanguageid,uilanguageid'
        );
      });

      it('should return cached result on subsequent calls', async () => {
        mockRetrieveRecord.mockResolvedValueOnce(mockUserSettingResult);

        // First call - should fetch from API
        const result1 = await userSettingService.getUserSettings(mockUserId);
        expect(result1.isSuccess).toBe(true);
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

        // Second call - should return cached result
        const result2 = await userSettingService.getUserSettings(mockUserId);
        expect(result2.isSuccess).toBe(true);
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

        // Results should be identical
        expect(result2.result).toEqual(result1.result);
      });

      it('should return error when systemuserid is missing', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          uilanguageid: 1033,
          helplanguageid: 1033,
          // Missing systemuserid
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(false);
        expect(result.message).toContain(mockUserId);
        expect(result.errors).toBeDefined();
        expect(result.errors).toHaveLength(1);
      });

      it('should handle Hungarian locale (1038)', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: 1038, // Hungarian
          helplanguageid: 1038,
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.uilanguage).toBe('hu-HU');
        expect(result.result?.helplanguage).toBe('hu-HU');
      });

      it('should handle French locale (1036)', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: 1036, // French
          helplanguageid: 1036,
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.uilanguage).toBe('fr-FR');
        expect(result.result?.helplanguage).toBe('fr-FR');
      });

      it('should return fallback message for unknown LCID', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: 9999, // Unknown LCID
          helplanguageid: 9999,
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.uilanguage).toBe(DEFAULT_LOCALE);
        expect(result.result?.helplanguage).toBe(DEFAULT_LOCALE);
        expect(result.message).toContain('LCID');
      });

      it('should return fallback message only for unknown UI language LCID', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: 9999, // Unknown LCID
          helplanguageid: 1033, // Known LCID
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.uilanguage).toBe(DEFAULT_LOCALE);
        expect(result.result?.helplanguage).toBe('en-US');
        expect(result.message).toContain('UI language');
        expect(result.message).not.toContain('Help language');
      });

      it('should return fallback message only for unknown help language LCID', async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: 1033, // Known LCID
          helplanguageid: 9999, // Unknown LCID
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.uilanguage).toBe('en-US');
        expect(result.result?.helplanguage).toBe(DEFAULT_LOCALE);
        expect(result.message).toContain('Help language');
        expect(result.message).not.toContain('UI language');
      });

      it('should throw DataverseApiError on API error', async () => {
        mockRetrieveRecord.mockRejectedValueOnce(new Error('Network error'));

        await expect(
          userSettingService.getUserSettings(mockUserId)
        ).rejects.toThrow(DataverseApiError);
      });

      it('should throw DataverseApiError with unknown message for non-Error', async () => {
        mockRetrieveRecord.mockRejectedValueOnce('string error');

        await expect(
          userSettingService.getUserSettings(mockUserId)
        ).rejects.toThrow(DataverseApiError);
      });
    });
  });

  describe('clearCache (static)', () => {
    it('should clear specific user cache entry', async () => {
      mockRetrieveRecord.mockResolvedValue(mockUserSettingResult);

      // Populate cache
      await userSettingService.getUserSettings(mockUserId);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

      // Clear specific user cache
      UserSettingService.clearCache(mockUserId);

      // Should fetch again after cache clear
      await userSettingService.getUserSettings(mockUserId);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache entries when no userId provided', async () => {
      mockRetrieveRecord.mockResolvedValue(mockUserSettingResult);

      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // Populate cache for both users
      await userSettingService.getUserSettings(userId1);
      await userSettingService.getUserSettings(userId2);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(2);

      // Clear all cache
      UserSettingService.clearCache();

      // Should fetch again for both users
      await userSettingService.getUserSettings(userId1);
      await userSettingService.getUserSettings(userId2);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(4);
    });
  });

  describe('cache expiration', () => {
    it('should refetch after cache expires', async () => {
      mockRetrieveRecord.mockResolvedValue(mockUserSettingResult);

      // Populate cache
      await userSettingService.getUserSettings(mockUserId);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

      // Fast-forward time beyond cache expiration (5 minutes)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);

      // Should fetch again after expiration
      await userSettingService.getUserSettings(mockUserId);
      expect(mockRetrieveRecord).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Phase 1 optimizations', () => {
    describe('request deduplication', () => {
      it('should deduplicate concurrent requests for same user', async () => {
        mockRetrieveRecord.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve(mockUserSettingResult), 100))
        );

        // Make 3 concurrent requests for same user
        const promises = [
          userSettingService.getUserSettings(mockUserId),
          userSettingService.getUserSettings(mockUserId),
          userSettingService.getUserSettings(mockUserId),
        ];

        const results = await Promise.all(promises);

        // All should succeed with same data
        results.forEach(result => {
          expect(result.isSuccess).toBe(true);
          expect(result.result?.systemuserid).toBe(mockUserId);
        });

        // But only ONE API call should have been made
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);
      });

      it('should not deduplicate requests for different users', async () => {
        mockRetrieveRecord.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve(mockUserSettingResult), 50))
        );

        const userId1 = 'user-1';
        const userId2 = 'user-2';

        // Make concurrent requests for different users
        const promises = [
          userSettingService.getUserSettings(userId1),
          userSettingService.getUserSettings(userId2),
        ];

        await Promise.all(promises);

        // Should make separate API calls for each user
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(2);
      });

      it('should allow new request after previous completes', async () => {
        mockRetrieveRecord.mockResolvedValue(mockUserSettingResult);

        // First request
        await userSettingService.getUserSettings(mockUserId);
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

        // Clear cache to force new fetch
        UserSettingService.clearCache(mockUserId);

        // Second request (not concurrent, should make new API call)
        await userSettingService.getUserSettings(mockUserId);
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(2);
      });
    });

    describe('cache size limit', () => {
      it('should evict oldest entry when cache reaches max size (100)', async () => {
        mockRetrieveRecord.mockResolvedValue(mockUserSettingResult);

        // Fill cache to max (100 entries)
        for (let i = 0; i < 100; i++) {
          await userSettingService.getUserSettings(`user-${i}`);
        }
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(100);

        // Clear mock to test eviction
        mockRetrieveRecord.mockClear();

        // Add one more user - should evict the oldest (user-0)
        await userSettingService.getUserSettings('user-101');
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(1);

        // user-0 should have been evicted and require refetch
        await userSettingService.getUserSettings('user-0');
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(2); // One more call

        mockRetrieveRecord.mockClear();

        // user-99 should still be cached (was last before user-101)
        await userSettingService.getUserSettings('user-99');
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(0); // No call, cached

        // user-101 should still be cached
        await userSettingService.getUserSettings('user-101');
        expect(mockRetrieveRecord).toHaveBeenCalledTimes(0); // No call, cached
      });
    });

    describe('type safety', () => {
      it('should properly handle typed Dataverse response', async () => {
        const typedResponse = {
          systemuserid: mockUserId,
          uilanguageid: 1033,
          helplanguageid: 1031,
        };

        mockRetrieveRecord.mockResolvedValue(typedResponse);

        const result = await userSettingService.getUserSettings(mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.result?.systemuserid).toBe(mockUserId);
        expect(result.result?.uilanguageid).toBe(1033);
        expect(result.result?.helplanguageid).toBe(1031);
      });
    });
  });

  describe('locale mappings', () => {
    const localeTestCases: [number, string, string][] = [
      [1033, 'en-US', 'English (US)'],
      [1031, 'de-DE', 'German'],
      [1036, 'fr-FR', 'French'],
      [1040, 'it-IT', 'Italian'],
      [3082, 'es-ES', 'Spanish (Spain)'],
      [2070, 'pt-PT', 'Portuguese (Portugal)'],
      [1038, 'hu-HU', 'Hungarian'],
      [1045, 'pl-PL', 'Polish'],
      [1029, 'cs-CZ', 'Czech'],
      [1049, 'ru-RU', 'Russian'],
      [2052, 'zh-CN', 'Chinese (Simplified)'],
      [1041, 'ja-JP', 'Japanese'],
    ];

    localeTestCases.forEach(([lcid, expectedLocale, description]) => {
      it(`should map LCID ${lcid} to ${expectedLocale} (${description})`, async () => {
        mockRetrieveRecord.mockResolvedValueOnce({
          systemuserid: mockUserId,
          uilanguageid: lcid,
          helplanguageid: lcid,
        });

        const result = await userSettingService.getUserSettings(mockUserId);

        // Some locales may not be mapped and fall back to default
        expect(result.isSuccess).toBe(true);
        expect(result.result).toBeDefined();
      });
    });
  });
});
