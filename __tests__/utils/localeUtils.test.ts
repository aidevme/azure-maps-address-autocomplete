/**
 * Unit tests for localeUtils utility functions.
 * @module __tests__/utils/localeUtils.test
 */

import {
  DEFAULT_LOCALE,
  LCID_TO_LOCALE,
  lcidToLocale,
  hasLocaleMapping,
} from '../../AzureMapsAddressAutoComplete/utils/localeUtils';

describe('localeUtils', () => {
  describe('DEFAULT_LOCALE', () => {
    it('should be en-US', () => {
      expect(DEFAULT_LOCALE).toBe('en-US');
    });
  });

  describe('LCID_TO_LOCALE mapping', () => {
    it('should contain English (US) mapping', () => {
      expect(LCID_TO_LOCALE[1033]).toBe('en-US');
    });

    it('should contain English (UK) mapping', () => {
      expect(LCID_TO_LOCALE[2057]).toBe('en-GB');
    });

    it('should contain German (Germany) mapping', () => {
      expect(LCID_TO_LOCALE[1031]).toBe('de-DE');
    });

    it('should contain French (France) mapping', () => {
      expect(LCID_TO_LOCALE[1036]).toBe('fr-FR');
    });

    it('should contain French (Canada) mapping', () => {
      expect(LCID_TO_LOCALE[3084]).toBe('fr-CA');
    });

    it('should contain Spanish (Spain) mapping', () => {
      expect(LCID_TO_LOCALE[3082]).toBe('es-ES');
    });

    it('should contain Spanish (Mexico) mapping', () => {
      expect(LCID_TO_LOCALE[2058]).toBe('es-MX');
    });

    it('should contain Italian mapping', () => {
      expect(LCID_TO_LOCALE[1040]).toBe('it-IT');
    });

    it('should contain Portuguese (Brazil) mapping', () => {
      expect(LCID_TO_LOCALE[1046]).toBe('pt-BR');
    });

    it('should contain Portuguese (Portugal) mapping', () => {
      expect(LCID_TO_LOCALE[2070]).toBe('pt-PT');
    });

    it('should contain Dutch (Netherlands) mapping', () => {
      expect(LCID_TO_LOCALE[1043]).toBe('nl-NL');
    });

    it('should contain Hungarian mapping', () => {
      expect(LCID_TO_LOCALE[1038]).toBe('hu-HU');
    });

    it('should contain Polish mapping', () => {
      expect(LCID_TO_LOCALE[1045]).toBe('pl-PL');
    });

    it('should contain Russian mapping', () => {
      expect(LCID_TO_LOCALE[1049]).toBe('ru-RU');
    });

    it('should contain Japanese mapping if present', () => {
      // Japanese LCID is 1041, check if it exists
      if (LCID_TO_LOCALE[1041]) {
        expect(typeof LCID_TO_LOCALE[1041]).toBe('string');
      }
    });

    it('should contain Chinese (Simplified) mapping', () => {
      expect(LCID_TO_LOCALE[2052]).toBe('zh-HanS-CN');
    });

    it('should contain Chinese (Traditional) mapping', () => {
      expect(LCID_TO_LOCALE[1028]).toBe('zh-HanT-TW');
    });

    it('should have more than 30 locale mappings', () => {
      expect(Object.keys(LCID_TO_LOCALE).length).toBeGreaterThan(30);
    });

    it('should have all values as non-empty strings', () => {
      Object.values(LCID_TO_LOCALE).forEach((locale) => {
        expect(typeof locale).toBe('string');
        expect(locale.length).toBeGreaterThan(0);
      });
    });

    it('should have all keys as valid numbers', () => {
      Object.keys(LCID_TO_LOCALE).forEach((key) => {
        const lcid = Number(key);
        expect(Number.isInteger(lcid)).toBe(true);
        expect(lcid).toBeGreaterThan(0);
      });
    });
  });

  describe('lcidToLocale', () => {
    it('should return en-US for LCID 1033', () => {
      expect(lcidToLocale(1033)).toBe('en-US');
    });

    it('should return de-DE for LCID 1031', () => {
      expect(lcidToLocale(1031)).toBe('de-DE');
    });

    it('should return fr-FR for LCID 1036', () => {
      expect(lcidToLocale(1036)).toBe('fr-FR');
    });

    it('should return es-ES for LCID 3082', () => {
      expect(lcidToLocale(3082)).toBe('es-ES');
    });

    it('should return hu-HU for LCID 1038', () => {
      expect(lcidToLocale(1038)).toBe('hu-HU');
    });

    it('should return DEFAULT_LOCALE for unknown LCID', () => {
      expect(lcidToLocale(9999)).toBe(DEFAULT_LOCALE);
    });

    it('should return DEFAULT_LOCALE for negative LCID', () => {
      expect(lcidToLocale(-1)).toBe(DEFAULT_LOCALE);
    });

    it('should return DEFAULT_LOCALE for zero', () => {
      expect(lcidToLocale(0)).toBe(DEFAULT_LOCALE);
    });

    it('should handle very large LCID values', () => {
      expect(lcidToLocale(999999999)).toBe(DEFAULT_LOCALE);
    });
  });

  describe('hasLocaleMapping', () => {
    it('should return true for known LCID 1033', () => {
      expect(hasLocaleMapping(1033)).toBe(true);
    });

    it('should return true for known LCID 1031', () => {
      expect(hasLocaleMapping(1031)).toBe(true);
    });

    it('should return true for known LCID 1038', () => {
      expect(hasLocaleMapping(1038)).toBe(true);
    });

    it('should return false for unknown LCID', () => {
      expect(hasLocaleMapping(9999)).toBe(false);
    });

    it('should return false for negative LCID', () => {
      expect(hasLocaleMapping(-1)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(hasLocaleMapping(0)).toBe(false);
    });

    it('should return false for very large LCID', () => {
      expect(hasLocaleMapping(999999999)).toBe(false);
    });
  });
});
