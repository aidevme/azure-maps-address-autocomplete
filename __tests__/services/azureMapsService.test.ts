/**
 * Unit tests for Azure Maps Service
 */
import {
  searchAddress,
  searchFuzzy,
  searchMunicipalities,
  searchNearby,
  fetchPostalCodesForMunicipality,
  normalizeResults,
  createPostalCodeResult,
  AzureMapsApiError,
  AzureMapsSearchResult,
} from '../../AzureMapsAddressAutoComplete/services/AzureMap/azureMapsService';

// Mock the types module
jest.mock('../../AzureMapsAddressAutoComplete/types', () => ({
  isAzureMapsSearchResponse: jest.fn((data) => {
    return data && typeof data === 'object' && 'results' in data && Array.isArray(data.results);
  }),
  extractValidResults: jest.fn((data) => data.results || []),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('azureMapsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console warnings/errors in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockSearchResult: AzureMapsSearchResult = {
    type: 'Street',
    id: 'result-1',
    score: 10.5,
    entityType: 'Street',
    address: {
      freeformAddress: '123 Main St, Seattle, WA 98101',
      streetNumber: '123',
      streetName: 'Main St',
      municipality: 'Seattle',
      countrySubdivision: 'WA',
      countrySubdivisionName: 'Washington',
      postalCode: '98101',
      country: 'United States',
      countryCode: 'US',
    },
    position: {
      lat: 47.6062,
      lon: -122.3321,
    },
  };

  const mockMunicipalityResult: AzureMapsSearchResult = {
    type: 'Geography',
    id: 'muni-1',
    entityType: 'Municipality',
    address: {
      freeformAddress: 'Seattle, WA',
      municipality: 'Seattle',
      countrySubdivision: 'WA',
      countrySubdivisionName: 'Washington',
      country: 'United States',
      countryCode: 'US',
      extendedPostalCode: '98101,98102,98103',
    },
    position: {
      lat: 47.6062,
      lon: -122.3321,
    },
  };

  describe('AzureMapsApiError', () => {
    it('should create error with all properties', () => {
      const error = new AzureMapsApiError(
        'Test error',
        'TestCode',
        400,
        'query',
        [{ code: 'Detail1', message: 'Detail message' }]
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TestCode');
      expect(error.httpStatus).toBe(400);
      expect(error.target).toBe('query');
      expect(error.details).toHaveLength(1);
      expect(error.name).toBe('AzureMapsApiError');
    });

    it('should create error without optional properties', () => {
      const error = new AzureMapsApiError('Test error', 'TestCode', 500);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TestCode');
      expect(error.httpStatus).toBe(500);
      expect(error.target).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it('should return formatted toString() with target', () => {
      const error = new AzureMapsApiError('Test error', 'TestCode', 400, 'query');

      expect(error.toString()).toBe(
        'AzureMapsApiError [TestCode] (HTTP 400): Test error (target: query)'
      );
    });

    it('should return formatted toString() without target', () => {
      const error = new AzureMapsApiError('Test error', 'TestCode', 400);

      expect(error.toString()).toBe(
        'AzureMapsApiError [TestCode] (HTTP 400): Test error'
      );
    });

    it('should be an instance of Error', () => {
      const error = new AzureMapsApiError('Test', 'Code', 500);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('searchAddress', () => {
    it('should call fetch with correct URL parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockSearchResult] }),
      });

      await searchAddress({
        subscriptionKey: 'test-key',
        query: 'Seattle',
        language: 'en-US',
        countrySet: 'US',
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('atlas.microsoft.com/search/address/json');
      expect(calledUrl).toContain('subscription-key=test-key');
      expect(calledUrl).toContain('query=Seattle');
      expect(calledUrl).toContain('language=en-US');
      expect(calledUrl).toContain('countrySet=US');
      expect(calledUrl).toContain('limit=10');
    });

    it('should return search results on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockSearchResult] }),
      });

      const results = await searchAddress({
        subscriptionKey: 'test-key',
        query: 'Seattle',
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockSearchResult);
    });

    it('should throw AzureMapsApiError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 'Unauthorized',
            message: 'Invalid subscription key',
          },
        }),
      });

      await expect(
        searchAddress({
          subscriptionKey: 'invalid-key',
          query: 'Seattle',
        })
      ).rejects.toThrow(AzureMapsApiError);
    });

    it('should throw error with correct HTTP status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 'RateLimitExceeded',
            message: 'Too many requests',
          },
        }),
      });

      try {
        await searchAddress({
          subscriptionKey: 'test-key',
          query: 'Seattle',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AzureMapsApiError);
        expect((error as AzureMapsApiError).httpStatus).toBe(429);
        expect((error as AzureMapsApiError).code).toBe('RateLimitExceeded');
      }
    });

    it('should handle non-JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        searchAddress({
          subscriptionKey: 'test-key',
          query: 'Seattle',
        })
      ).rejects.toThrow(AzureMapsApiError);
    });

    it('should return empty array for unexpected response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'format' }),
      });

      // Override the mock to return false for invalid data
      const { isAzureMapsSearchResponse } = require('../../AzureMapsAddressAutoComplete/types');
      isAzureMapsSearchResponse.mockReturnValueOnce(false);

      const results = await searchAddress({
        subscriptionKey: 'test-key',
        query: 'Seattle',
      });

      expect(results).toEqual([]);
    });

    it('should include lat/lon parameters when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await searchAddress({
        subscriptionKey: 'test-key',
        query: 'coffee',
        lat: 47.6062,
        lon: -122.3321,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=47.6062');
      expect(calledUrl).toContain('lon=-122.3321');
    });

    it('should include radius parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await searchAddress({
        subscriptionKey: 'test-key',
        query: 'coffee',
        radius: 5000,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('radius=5000');
    });
  });

  describe('searchFuzzy', () => {
    it('should call fuzzy search endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockSearchResult] }),
      });

      await searchFuzzy({
        subscriptionKey: 'test-key',
        query: 'Seattle',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('atlas.microsoft.com/search/fuzzy/json');
    });

    it('should include entityType parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await searchFuzzy({
        subscriptionKey: 'test-key',
        query: 'Seattle',
        entityType: 'Municipality',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('entityType=Municipality');
    });

    it('should return results on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockMunicipalityResult] }),
      });

      const results = await searchFuzzy({
        subscriptionKey: 'test-key',
        query: 'Seattle',
        entityType: 'Municipality',
      });

      expect(results).toHaveLength(1);
    });

    it('should include extendedPostalCodesFor parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await searchFuzzy({
        subscriptionKey: 'test-key',
        query: 'Seattle',
        extendedPostalCodesFor: 'Geo',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('extendedPostalCodesFor=Geo');
    });
  });

  describe('searchMunicipalities', () => {
    it('should call searchFuzzy with Municipality entityType', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockMunicipalityResult] }),
      });

      await searchMunicipalities({
        subscriptionKey: 'test-key',
        query: 'Seattle',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('entityType=Municipality');
      expect(calledUrl).toContain('extendedPostalCodesFor=Geo');
    });

    it('should return municipality results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [mockMunicipalityResult] }),
      });

      const results = await searchMunicipalities({
        subscriptionKey: 'test-key',
        query: 'Seattle',
        language: 'en-US',
        countrySet: 'US',
      });

      expect(results).toHaveLength(1);
      expect(results[0].entityType).toBe('Municipality');
    });
  });

  describe('searchNearby', () => {
    it('should call searchFuzzy with location parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await searchNearby({
        subscriptionKey: 'test-key',
        query: 'coffee',
        lat: 47.6062,
        lon: -122.3321,
        radius: 1000,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('lat=47.6062');
      expect(calledUrl).toContain('lon=-122.3321');
      expect(calledUrl).toContain('radius=1000');
    });
  });

  describe('fetchPostalCodesForMunicipality', () => {
    it('should return empty array for missing subscriptionKey', async () => {
      const result = await fetchPostalCodesForMunicipality(
        '',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return empty array for missing municipalityName', async () => {
      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        '',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch postal codes from nearby and address search', async () => {
      const nearbyResult: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Seattle',
          postalCode: '98101,98102',
        },
      };

      const addressResult: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Seattle',
          postalCode: '98103',
        },
      };

      // Mock nearby search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [nearbyResult] }),
      });

      // Mock address search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [addressResult] }),
      });

      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 },
        'en-US'
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toContain('98101');
      expect(result).toContain('98102');
      expect(result).toContain('98103');
    });

    it('should match municipality by localName', async () => {
      const resultWithLocalName: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Different Name',
          localName: 'Seattle',
          postalCode: '98104',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [resultWithLocalName] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      expect(result).toContain('98104');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should return sorted unique postal codes', async () => {
      const nearbyResult: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Seattle',
          postalCode: '98103,98101',
        },
      };

      const addressResult: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Seattle',
          postalCode: '98101,98102',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [nearbyResult] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [addressResult] }),
      });

      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      // Should be sorted and unique
      expect(result).toEqual(['98101', '98102', '98103']);
    });

    it('should filter out non-matching municipalities', async () => {
      const nonMatchingResult: AzureMapsSearchResult = {
        ...mockSearchResult,
        address: {
          ...mockSearchResult.address,
          municipality: 'Bellevue',
          postalCode: '98004',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [nonMatchingResult] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchPostalCodesForMunicipality(
        'test-key',
        'Seattle',
        'US',
        { lat: 47.6062, lon: -122.3321 }
      );

      expect(result).not.toContain('98004');
    });
  });

  describe('normalizeResults', () => {
    it('should return results unchanged when postal code exists', () => {
      const results: AzureMapsSearchResult[] = [
        {
          ...mockSearchResult,
          address: {
            ...mockSearchResult.address,
            postalCode: '98101',
          },
        },
      ];

      const normalized = normalizeResults(results);

      expect(normalized[0].address.postalCode).toBe('98101');
    });

    it('should extract postal code from extendedPostalCode', () => {
      const results: AzureMapsSearchResult[] = [
        {
          ...mockSearchResult,
          address: {
            ...mockSearchResult.address,
            postalCode: undefined,
            extendedPostalCode: '98101-1234,98102-5678',
          },
        },
      ];

      const normalized = normalizeResults(results);

      expect(normalized[0].address.postalCode).toBe('98101-1234');
    });

    it('should extract postal code from freeformAddress for PostalCodeArea', () => {
      const results: AzureMapsSearchResult[] = [
        {
          ...mockSearchResult,
          entityType: 'PostalCodeArea',
          address: {
            ...mockSearchResult.address,
            postalCode: undefined,
            extendedPostalCode: undefined,
            freeformAddress: '98101 Seattle',
          },
        },
      ];

      const normalized = normalizeResults(results);

      expect(normalized[0].address.postalCode).toBe('98101');
    });

    it('should handle results without postal code information', () => {
      const results: AzureMapsSearchResult[] = [
        {
          ...mockSearchResult,
          entityType: 'Municipality',
          address: {
            ...mockSearchResult.address,
            postalCode: undefined,
            extendedPostalCode: undefined,
            freeformAddress: 'Seattle, WA',
          },
        },
      ];

      const normalized = normalizeResults(results);

      expect(normalized[0].address.postalCode).toBeUndefined();
    });

    it('should handle empty results array', () => {
      const normalized = normalizeResults([]);
      expect(normalized).toEqual([]);
    });

    it('should normalize multiple results', () => {
      const results: AzureMapsSearchResult[] = [
        {
          ...mockSearchResult,
          address: {
            ...mockSearchResult.address,
            postalCode: '98101',
          },
        },
        {
          ...mockSearchResult,
          id: 'result-2',
          address: {
            ...mockSearchResult.address,
            postalCode: undefined,
            extendedPostalCode: '98102',
          },
        },
      ];

      const normalized = normalizeResults(results);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].address.postalCode).toBe('98101');
      expect(normalized[1].address.postalCode).toBe('98102');
    });
  });

  describe('createPostalCodeResult', () => {
    it('should create a postal code result from municipality', () => {
      const result = createPostalCodeResult('98101', mockMunicipalityResult);

      expect(result.type).toBe('PostalCode');
      expect(result.id).toBe('postal-98101');
      expect(result.entityType).toBe('PostalCodeArea');
      expect(result.address.postalCode).toBe('98101');
      expect(result.address.municipality).toBe('Seattle');
      expect(result.address.freeformAddress).toBe('98101 Seattle');
      expect(result.position).toEqual(mockMunicipalityResult.position);
    });

    it('should preserve country information', () => {
      const result = createPostalCodeResult('98101', mockMunicipalityResult);

      expect(result.address.country).toBe('United States');
      expect(result.address.countryCode).toBe('US');
      expect(result.address.countrySubdivision).toBe('WA');
      expect(result.address.countrySubdivisionName).toBe('Washington');
    });

    it('should create unique IDs for different postal codes', () => {
      const result1 = createPostalCodeResult('98101', mockMunicipalityResult);
      const result2 = createPostalCodeResult('98102', mockMunicipalityResult);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.address.postalCode).toBe('98101');
      expect(result2.address.postalCode).toBe('98102');
    });
  });
});
