/**
 * Unit tests for pcfPropertyHelpers utility functions.
 * @module __tests__/utils/pcfPropertyHelpers.test
 */

import {
  getStringValue,
  getNumberValue,
  getBooleanValue,
  getMapSizeValue,
  type MapSize,
} from '../../AzureMapsAddressAutoComplete/utils/pcfPropertyHelpers';

describe('pcfPropertyHelpers', () => {
  describe('getStringValue', () => {
    it('should return raw value from valid property', () => {
      const property = { raw: 'test value' };
      expect(getStringValue(property)).toBe('test value');
    });

    it('should return default value when raw is null', () => {
      const property = { raw: null };
      expect(getStringValue(property)).toBe('');
    });

    it('should return custom default value when raw is null', () => {
      const property = { raw: null };
      expect(getStringValue(property, 'default')).toBe('default');
    });

    it('should return default value when property is undefined', () => {
      expect(getStringValue(undefined)).toBe('');
    });

    it('should return default value when property is null', () => {
      expect(getStringValue(null)).toBe('');
    });

    it('should return custom default value when property is undefined', () => {
      expect(getStringValue(undefined, 'custom default')).toBe('custom default');
    });

    it('should return default value when property is not an object', () => {
      expect(getStringValue('string value')).toBe('');
    });

    it('should return default value when property is a number', () => {
      expect(getStringValue(123)).toBe('');
    });

    it('should return default value when property has no raw field', () => {
      const property = { value: 'test' };
      expect(getStringValue(property)).toBe('');
    });

    it('should handle empty string as valid value', () => {
      const property = { raw: '' };
      expect(getStringValue(property, 'default')).toBe('');
    });

    it('should handle error-typed properties gracefully', () => {
      const errorProperty = { error: true, errorMessage: 'Error' };
      expect(getStringValue(errorProperty)).toBe('');
    });
  });

  describe('getNumberValue', () => {
    it('should return raw value from valid property', () => {
      const property = { raw: 42 };
      expect(getNumberValue(property)).toBe(42);
    });

    it('should return zero as valid value', () => {
      const property = { raw: 0 };
      expect(getNumberValue(property)).toBe(0);
    });

    it('should return negative numbers', () => {
      const property = { raw: -123.45 };
      expect(getNumberValue(property)).toBe(-123.45);
    });

    it('should return undefined when raw is null', () => {
      const property = { raw: null };
      expect(getNumberValue(property)).toBeUndefined();
    });

    it('should return undefined when property is undefined', () => {
      expect(getNumberValue(undefined)).toBeUndefined();
    });

    it('should return undefined when property is null', () => {
      expect(getNumberValue(null)).toBeUndefined();
    });

    it('should return undefined when property is not an object', () => {
      expect(getNumberValue('string')).toBeUndefined();
    });

    it('should return undefined when property has no raw field', () => {
      const property = { value: 42 };
      expect(getNumberValue(property)).toBeUndefined();
    });

    it('should handle decimal numbers', () => {
      const property = { raw: 47.606201 };
      expect(getNumberValue(property)).toBe(47.606201);
    });

    it('should handle error-typed properties gracefully', () => {
      const errorProperty = { error: true, errorMessage: 'Error' };
      expect(getNumberValue(errorProperty)).toBeUndefined();
    });
  });

  describe('getBooleanValue', () => {
    it('should return true from valid property', () => {
      const property = { raw: true };
      expect(getBooleanValue(property)).toBe(true);
    });

    it('should return false from valid property', () => {
      const property = { raw: false };
      expect(getBooleanValue(property)).toBe(false);
    });

    it('should return default value when raw is null', () => {
      const property = { raw: null };
      expect(getBooleanValue(property)).toBe(false);
    });

    it('should return custom default value when raw is null', () => {
      const property = { raw: null };
      expect(getBooleanValue(property, true)).toBe(true);
    });

    it('should return default value when property is undefined', () => {
      expect(getBooleanValue(undefined)).toBe(false);
    });

    it('should return default value when property is null', () => {
      expect(getBooleanValue(null)).toBe(false);
    });

    it('should return custom default value when property is undefined', () => {
      expect(getBooleanValue(undefined, true)).toBe(true);
    });

    it('should return default value when property is not an object', () => {
      expect(getBooleanValue('true')).toBe(false);
    });

    it('should return default value when property has no raw field', () => {
      const property = { value: true };
      expect(getBooleanValue(property)).toBe(false);
    });

    it('should handle error-typed properties gracefully', () => {
      const errorProperty = { error: true, errorMessage: 'Error' };
      expect(getBooleanValue(errorProperty)).toBe(false);
    });
  });

  describe('getMapSizeValue', () => {
    it('should return small for raw value 0', () => {
      const property = { raw: 0 };
      expect(getMapSizeValue(property)).toBe('small');
    });

    it('should return medium for raw value 1', () => {
      const property = { raw: 1 };
      expect(getMapSizeValue(property)).toBe('medium');
    });

    it('should return large for raw value 2', () => {
      const property = { raw: 2 };
      expect(getMapSizeValue(property)).toBe('large');
    });

    it('should return default value when raw is null', () => {
      const property = { raw: null };
      expect(getMapSizeValue(property)).toBe('medium');
    });

    it('should return custom default value when raw is null', () => {
      const property = { raw: null };
      expect(getMapSizeValue(property, 'large')).toBe('large');
    });

    it('should return default value for invalid raw value', () => {
      const property = { raw: 99 };
      expect(getMapSizeValue(property)).toBe('medium');
    });

    it('should return default value for negative raw value', () => {
      const property = { raw: -1 };
      expect(getMapSizeValue(property)).toBe('medium');
    });

    it('should return default value when property is undefined', () => {
      expect(getMapSizeValue(undefined)).toBe('medium');
    });

    it('should return default value when property is null', () => {
      expect(getMapSizeValue(null)).toBe('medium');
    });

    it('should return custom default value when property is undefined', () => {
      expect(getMapSizeValue(undefined, 'small')).toBe('small');
    });

    it('should return default value when property is not an object', () => {
      expect(getMapSizeValue('medium')).toBe('medium');
    });

    it('should return default value when property has no raw field', () => {
      const property = { value: 1 };
      expect(getMapSizeValue(property)).toBe('medium');
    });

    it('should handle error-typed properties gracefully', () => {
      const errorProperty = { error: true, errorMessage: 'Error' };
      expect(getMapSizeValue(errorProperty)).toBe('medium');
    });

    it('should return correct MapSize type', () => {
      const property = { raw: 0 };
      const result: MapSize = getMapSizeValue(property);
      expect(['small', 'medium', 'large']).toContain(result);
    });
  });
});
