/**
 * Unit tests for formatters utility functions.
 * @module __tests__/utils/formatters.test
 */

import {
  formatScore,
  formatCoordinates,
  formatPrimaryAddress,
  formatSecondaryAddress,
  formatCountryCode,
  formatPostalCode,
} from '../../AzureMapsAddressAutoComplete/utils/formatters';

describe('formatters', () => {
  describe('formatScore', () => {
    it('should format a valid number score with 2 decimal places', () => {
      expect(formatScore(0.95)).toBe(' • Score: 0.95');
    });

    it('should format integer scores', () => {
      expect(formatScore(1)).toBe(' • Score: 1.00');
    });

    it('should format zero score', () => {
      expect(formatScore(0)).toBe(' • Score: 0.00');
    });

    it('should format scores with many decimal places', () => {
      expect(formatScore(0.123456789)).toBe(' • Score: 0.12');
    });

    it('should return null for undefined', () => {
      expect(formatScore(undefined)).toBeNull();
    });

    it('should return null for null', () => {
      expect(formatScore(null)).toBeNull();
    });

    it('should return null for string values', () => {
      expect(formatScore('0.95')).toBeNull();
    });

    it('should return null for NaN', () => {
      expect(formatScore(NaN)).toBe(' • Score: NaN');
    });

    it('should return null for objects', () => {
      expect(formatScore({ value: 0.95 })).toBeNull();
    });

    it('should return null for arrays', () => {
      expect(formatScore([0.95])).toBeNull();
    });
  });

  describe('formatCoordinates', () => {
    it('should format valid coordinates with 6 decimal places', () => {
      expect(formatCoordinates(47.6062, -122.3321)).toBe('47.606200, -122.332100');
    });

    it('should format integer coordinates', () => {
      expect(formatCoordinates(47, -122)).toBe('47.000000, -122.000000');
    });

    it('should format zero coordinates', () => {
      expect(formatCoordinates(0, 0)).toBe('0.000000, 0.000000');
    });

    it('should format coordinates with many decimal places', () => {
      expect(formatCoordinates(47.60620123456789, -122.33210987654321)).toBe('47.606201, -122.332110');
    });

    it('should return null when latitude is undefined', () => {
      expect(formatCoordinates(undefined, -122.3321)).toBeNull();
    });

    it('should return null when longitude is undefined', () => {
      expect(formatCoordinates(47.6062, undefined)).toBeNull();
    });

    it('should return null when both are undefined', () => {
      expect(formatCoordinates(undefined, undefined)).toBeNull();
    });

    it('should handle negative coordinates', () => {
      expect(formatCoordinates(-33.8688, 151.2093)).toBe('-33.868800, 151.209300');
    });
  });

  describe('formatPrimaryAddress', () => {
    it('should format address with all fields', () => {
      const address = {
        countryCode: 'US',
        postalCode: '98101',
        freeformAddress: '123 Main St, Seattle, WA',
      };
      expect(formatPrimaryAddress(address)).toBe('[US] 98101 - 123 Main St, Seattle, WA');
    });

    it('should format address without country code', () => {
      const address = {
        postalCode: '98101',
        freeformAddress: '123 Main St, Seattle, WA',
      };
      expect(formatPrimaryAddress(address)).toBe('98101 - 123 Main St, Seattle, WA');
    });

    it('should format address without postal code', () => {
      const address = {
        countryCode: 'US',
        freeformAddress: '123 Main St, Seattle, WA',
      };
      expect(formatPrimaryAddress(address)).toBe('[US] 123 Main St, Seattle, WA');
    });

    it('should format address with only freeform address', () => {
      const address = {
        freeformAddress: '123 Main St, Seattle, WA',
      };
      expect(formatPrimaryAddress(address)).toBe('123 Main St, Seattle, WA');
    });

    it('should handle empty strings', () => {
      const address = {
        countryCode: '',
        postalCode: '',
        freeformAddress: 'Some Address',
      };
      expect(formatPrimaryAddress(address)).toBe('Some Address');
    });
  });

  describe('formatSecondaryAddress', () => {
    it('should format address with all fields', () => {
      const address = {
        municipality: 'Seattle',
        countrySubdivision: 'WA',
        country: 'United States',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address, 0.95, 47.6062, -122.3321)).toBe(
        'Seattle, WA, United States • 47.606200, -122.332100 • Score: 0.95'
      );
    });

    it('should format address without score', () => {
      const address = {
        municipality: 'Seattle',
        countrySubdivision: 'WA',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address, undefined, 47.6062, -122.3321)).toBe(
        'Seattle, WA • 47.606200, -122.332100'
      );
    });

    it('should format address without coordinates', () => {
      const address = {
        municipality: 'Seattle',
        countrySubdivision: 'WA',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address, 0.95)).toBe('Seattle, WA • Score: 0.95');
    });

    it('should format address with only municipality', () => {
      const address = {
        municipality: 'Seattle',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address)).toBe('Seattle');
    });

    it('should format address with only country subdivision', () => {
      const address = {
        countrySubdivision: 'WA',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address)).toBe('WA');
    });

    it('should format address with only country', () => {
      const address = {
        country: 'United States',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address)).toBe('United States');
    });

    it('should handle empty address', () => {
      const address = {
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address)).toBe('');
    });

    it('should handle invalid score type', () => {
      const address = {
        municipality: 'Seattle',
        freeformAddress: '',
      };
      expect(formatSecondaryAddress(address, 'invalid')).toBe('Seattle');
    });
  });

  describe('formatCountryCode', () => {
    it('should format valid country code', () => {
      expect(formatCountryCode('US')).toBe('[US] ');
    });

    it('should format lowercase country code', () => {
      expect(formatCountryCode('de')).toBe('[de] ');
    });

    it('should return empty string for undefined', () => {
      expect(formatCountryCode(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatCountryCode('')).toBe('');
    });
  });

  describe('formatPostalCode', () => {
    it('should format valid postal code', () => {
      expect(formatPostalCode('98101')).toBe('98101 - ');
    });

    it('should format alphanumeric postal code', () => {
      expect(formatPostalCode('SW1A 1AA')).toBe('SW1A 1AA - ');
    });

    it('should return empty string for undefined', () => {
      expect(formatPostalCode(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatPostalCode('')).toBe('');
    });
  });
});
