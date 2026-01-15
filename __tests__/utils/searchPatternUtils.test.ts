/**
 * Unit tests for searchPatternUtils utility functions.
 * @module __tests__/utils/searchPatternUtils.test
 */

import {
  parseSearchPattern,
  buildApiQuery,
  filterMunicipalitiesBySearchQuery,
  processPostalCodeToCityResults,
  processAddressResults,
  processResultsBySearchType,
  MIN_CHARS_FOR_SUGGESTIONS,
  DEBOUNCE_DELAY,
  type SearchType,
  type PostalCodeFetcher,
} from '../../AzureMapsAddressAutoComplete/utils/searchPatternUtils';
import type { AzureMapsSearchResult } from '../../AzureMapsAddressAutoComplete/services';

describe('searchPatternUtils', () => {
  describe('Constants', () => {
    it('should have MIN_CHARS_FOR_SUGGESTIONS set to 2', () => {
      expect(MIN_CHARS_FOR_SUGGESTIONS).toBe(2);
    });

    it('should have DEBOUNCE_DELAY set to 300', () => {
      expect(DEBOUNCE_DELAY).toBe(300);
    });
  });

  describe('parseSearchPattern', () => {
    describe('Pattern 1: Country set provided via prop', () => {
      it('should use entire input as query when countrySet is provided', () => {
        const result = parseSearchPattern('New York', 'US');
        expect(result).toEqual({
          query: 'New York',
          countrySet: 'US',
          searchType: 'address',
        });
      });

      it('should handle multiple countries in countrySet', () => {
        const result = parseSearchPattern('Toronto', 'US,CA,MX');
        expect(result).toEqual({
          query: 'Toronto',
          countrySet: 'US,CA,MX',
          searchType: 'address',
        });
      });

      it('should trim whitespace from countrySet', () => {
        const result = parseSearchPattern('Berlin', '  DE  ');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: 'DE',
          searchType: 'address',
        });
      });

      it('should treat empty countrySet as undefined', () => {
        const result = parseSearchPattern('CH, Zurich', '');
        // Falls through to Pattern 2
        expect(result).toEqual({
          query: 'Zurich',
          countrySet: 'CH',
          searchType: 'address',
        });
      });

      it('should treat whitespace-only countrySet as undefined', () => {
        const result = parseSearchPattern('DE, Berlin', '   ');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: 'DE',
          searchType: 'address',
        });
      });
    });

    describe('Pattern 2: Country code prefix (CC, query)', () => {
      it('should parse country code from input', () => {
        const result = parseSearchPattern('CH, Zurich');
        expect(result).toEqual({
          query: 'Zurich',
          countrySet: 'CH',
          searchType: 'address',
        });
      });

      it('should handle lowercase country code', () => {
        const result = parseSearchPattern('de, Berlin');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: 'DE',
          searchType: 'address',
        });
      });

      it('should handle mixed case country code', () => {
        const result = parseSearchPattern('Fr, Paris');
        expect(result).toEqual({
          query: 'Paris',
          countrySet: 'FR',
          searchType: 'address',
        });
      });

      it('should handle extra whitespace', () => {
        const result = parseSearchPattern('US  ,   Seattle');
        expect(result).toEqual({
          query: 'Seattle',
          countrySet: 'US',
          searchType: 'address',
        });
      });

      it('should search globally without country prefix', () => {
        const result = parseSearchPattern('Zurich');
        expect(result).toEqual({
          query: 'Zurich',
          countrySet: undefined,
          searchType: 'address',
        });
      });

      it('should not match 3-letter codes', () => {
        const result = parseSearchPattern('USA, New York');
        expect(result).toEqual({
          query: 'USA, New York',
          countrySet: undefined,
          searchType: 'address',
        });
      });
    });

    describe('Pattern 3: City-only postal code search (PLZ: or #)', () => {
      it('should parse PLZ: prefix', () => {
        const result = parseSearchPattern('PLZ: Zurich');
        expect(result).toEqual({
          query: 'Zurich',
          countrySet: undefined,
          searchType: 'postalcode',
        });
      });

      it('should parse PLZ: prefix case-insensitively', () => {
        const result = parseSearchPattern('plz: Berlin');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: undefined,
          searchType: 'postalcode',
        });
      });

      it('should parse # prefix', () => {
        const result = parseSearchPattern('#Berlin');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: undefined,
          searchType: 'postalcode',
        });
      });

      it('should preserve countrySet prop with PLZ:', () => {
        const result = parseSearchPattern('PLZ: Munich', 'DE');
        expect(result).toEqual({
          query: 'Munich',
          countrySet: 'DE',
          searchType: 'postalcode',
        });
      });

      it('should handle extra whitespace with PLZ:', () => {
        const result = parseSearchPattern('PLZ:   Vienna  ');
        expect(result).toEqual({
          query: 'Vienna',
          countrySet: undefined,
          searchType: 'postalcode',
        });
      });
    });

    describe('Pattern 4: Country code + postal code to city (CC,postalcode)', () => {
      it('should parse country code and numeric postal code', () => {
        const result = parseSearchPattern('CH,8001');
        expect(result).toEqual({
          query: '8001',
          countrySet: 'CH',
          searchType: 'postalcode-to-city',
        });
      });

      it('should handle lowercase country code', () => {
        const result = parseSearchPattern('de,10115');
        expect(result).toEqual({
          query: '10115',
          countrySet: 'DE',
          searchType: 'postalcode-to-city',
        });
      });

      it('should handle whitespace', () => {
        const result = parseSearchPattern('US , 98101');
        expect(result).toEqual({
          query: '98101',
          countrySet: 'US',
          searchType: 'postalcode-to-city',
        });
      });

      it('should not match non-numeric postal codes', () => {
        const result = parseSearchPattern('UK,SW1A');
        // Falls through to Pattern 2
        expect(result.searchType).toBe('address');
      });
    });

    describe('Pattern 5: Country code + city postal code (CC#city)', () => {
      it('should parse country code with hash and city', () => {
        const result = parseSearchPattern('CH#Zürich');
        expect(result).toEqual({
          query: 'Zürich',
          countrySet: 'CH',
          searchType: 'postalcode',
        });
      });

      it('should handle lowercase country code', () => {
        const result = parseSearchPattern('de#Berlin');
        expect(result).toEqual({
          query: 'Berlin',
          countrySet: 'DE',
          searchType: 'postalcode',
        });
      });

      it('should handle whitespace after hash', () => {
        const result = parseSearchPattern('AT#  Vienna');
        expect(result).toEqual({
          query: 'Vienna',
          countrySet: 'AT',
          searchType: 'postalcode',
        });
      });

      it('should override countrySet prop', () => {
        const result = parseSearchPattern('DE#Munich', 'AT');
        expect(result).toEqual({
          query: 'Munich',
          countrySet: 'DE',
          searchType: 'postalcode',
        });
      });
    });
  });

  describe('buildApiQuery', () => {
    it('should prepend "1" to address queries without numbers', () => {
      expect(buildApiQuery('Main Street', 'address')).toBe('1 Main Street');
    });

    it('should not modify address queries with numbers', () => {
      expect(buildApiQuery('123 Main Street', 'address')).toBe('123 Main Street');
    });

    it('should not modify postalcode queries', () => {
      expect(buildApiQuery('Berlin', 'postalcode')).toBe('Berlin');
    });

    it('should not modify postalcode-to-city queries', () => {
      expect(buildApiQuery('8001', 'postalcode-to-city')).toBe('8001');
    });

    it('should not prepend to query with embedded number', () => {
      expect(buildApiQuery('Street 5th Avenue', 'address')).toBe('Street 5th Avenue');
    });

    it('should handle empty query', () => {
      expect(buildApiQuery('', 'address')).toBe('1 ');
    });
  });

  describe('filterMunicipalitiesBySearchQuery', () => {
    const createResult = (municipality: string, freeformAddress = ''): AzureMapsSearchResult => ({
      id: '1',
      type: 'Geography',
      address: {
        municipality,
        freeformAddress,
      },
      position: { lat: 0, lon: 0 },
    });

    it('should keep results without parentheses', () => {
      const results = [createResult('Basel'), createResult('Zurich')];
      const filtered = filterMunicipalitiesBySearchQuery(results, 'Basel');
      expect(filtered).toHaveLength(2);
    });

    it('should exclude results where search term is in parentheses', () => {
      const results = [
        createResult('Basel'),
        createResult('Basel-Landschaft (Basel)'),
      ];
      const filtered = filterMunicipalitiesBySearchQuery(results, 'Basel');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].address.municipality).toBe('Basel');
    });

    it('should keep results where parentheses contain unrelated text', () => {
      const results = [
        createResult('Basel'),
        createResult('Basel-Stadt (Schweiz)'),
      ];
      const filtered = filterMunicipalitiesBySearchQuery(results, 'Basel');
      expect(filtered).toHaveLength(2);
    });

    it('should be case-insensitive', () => {
      const results = [
        createResult('BASEL'),
        createResult('Basel-Landschaft (BASEL)'),
      ];
      const filtered = filterMunicipalitiesBySearchQuery(results, 'basel');
      expect(filtered).toHaveLength(1);
    });

    it('should handle empty results', () => {
      const filtered = filterMunicipalitiesBySearchQuery([], 'Basel');
      expect(filtered).toHaveLength(0);
    });

    it('should keep results when municipality is empty (uses freeformAddress as fallback)', () => {
      // Note: The ?? operator returns freeformAddress only when municipality is null/undefined, not empty string
      const results = [createResult('', 'Basel-Landschaft (Basel)')];
      const filtered = filterMunicipalitiesBySearchQuery(results, 'Basel');
      // Empty string municipality means it uses empty string, not freeformAddress
      expect(filtered).toHaveLength(1);
    });
  });

  describe('processPostalCodeToCityResults', () => {
    const createResult = (municipality: string, localName?: string): AzureMapsSearchResult => ({
      id: '1',
      type: 'Geography',
      address: {
        municipality,
        localName,
        freeformAddress: '',
      },
      position: { lat: 0, lon: 0 },
    });

    it('should deduplicate by municipality', () => {
      const results = [
        createResult('Zurich'),
        createResult('Zurich'),
        createResult('Basel'),
      ];
      const processed = processPostalCodeToCityResults(results);
      expect(processed).toHaveLength(2);
    });

    it('should sort alphabetically', () => {
      const results = [
        createResult('Zurich'),
        createResult('Basel'),
        createResult('Geneva'),
      ];
      const processed = processPostalCodeToCityResults(results);
      expect(processed.map(r => r.address.municipality)).toEqual(['Basel', 'Geneva', 'Zurich']);
    });

    it('should use localName as fallback for deduplication when municipality is null/undefined', () => {
      const createResultWithLocalName = (localName: string): AzureMapsSearchResult => ({
        id: '1',
        type: 'Geography',
        address: {
          localName,
          freeformAddress: '',
          // municipality is undefined
        },
        position: { lat: 0, lon: 0 },
      });
      
      const results = [
        createResultWithLocalName('Zurich'),
        createResultWithLocalName('Zurich'),
        createResultWithLocalName('Basel'),
      ];
      const processed = processPostalCodeToCityResults(results);
      expect(processed).toHaveLength(2);
    });

    it('should exclude results without municipality or localName', () => {
      const results = [
        createResult('Zurich'),
        createResult(''),
      ];
      const processed = processPostalCodeToCityResults(results);
      expect(processed).toHaveLength(1);
    });

    it('should handle empty results', () => {
      const processed = processPostalCodeToCityResults([]);
      expect(processed).toHaveLength(0);
    });
  });

  describe('processAddressResults', () => {
    const createResult = (postalCode: string): AzureMapsSearchResult => ({
      id: '1',
      type: 'Address',
      address: {
        postalCode,
        freeformAddress: '',
      },
      position: { lat: 0, lon: 0 },
    });

    it('should sort by postal code', () => {
      const results = [
        createResult('98101'),
        createResult('10001'),
        createResult('60601'),
      ];
      const processed = processAddressResults(results);
      expect(processed.map(r => r.address.postalCode)).toEqual(['10001', '60601', '98101']);
    });

    it('should handle missing postal codes', () => {
      const results = [
        createResult('98101'),
        createResult(''),
        createResult('10001'),
      ];
      const processed = processAddressResults(results);
      expect(processed[0].address.postalCode).toBe('');
    });

    it('should handle alphanumeric postal codes', () => {
      const results = [
        createResult('SW1A 1AA'),
        createResult('EC1A 1BB'),
        createResult('W1A 1AA'),
      ];
      const processed = processAddressResults(results);
      expect(processed.map(r => r.address.postalCode)).toEqual(['EC1A 1BB', 'SW1A 1AA', 'W1A 1AA']);
    });

    it('should handle empty results', () => {
      const processed = processAddressResults([]);
      expect(processed).toHaveLength(0);
    });
  });

  describe('processResultsBySearchType', () => {
    const mockPostalCodeFetcher: PostalCodeFetcher = jest.fn().mockResolvedValue([]);

    const createResult = (municipality: string, postalCode = ''): AzureMapsSearchResult => ({
      id: '1',
      type: 'Address',
      address: {
        municipality,
        postalCode,
        freeformAddress: '',
      },
      position: { lat: 47.0, lon: 8.0 },
    });

    it('should route address type to processAddressResults', async () => {
      const results = [createResult('City', '20001'), createResult('City', '10001')];
      const processed = await processResultsBySearchType(
        results,
        'address',
        'City',
        undefined,
        mockPostalCodeFetcher
      );
      expect(processed[0].address.postalCode).toBe('10001');
    });

    it('should route postalcode-to-city type to processPostalCodeToCityResults', async () => {
      const results = [
        createResult('Zurich'),
        createResult('Zurich'),
        createResult('Basel'),
      ];
      const processed = await processResultsBySearchType(
        results,
        'postalcode-to-city',
        '8001',
        'CH',
        mockPostalCodeFetcher
      );
      expect(processed).toHaveLength(2);
    });

    it('should route postalcode type to processPostalCodeResults', async () => {
      const results = [createResult('Basel'), createResult('Basel-Landschaft (Basel)')];
      const processed = await processResultsBySearchType(
        results,
        'postalcode',
        'Basel',
        'CH',
        mockPostalCodeFetcher
      );
      // Should filter out parenthetical match
      expect(processed).toHaveLength(1);
    });
  });
});
