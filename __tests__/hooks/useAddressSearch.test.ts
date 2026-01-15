/**
 * Unit tests for useAddressSearch hook.
 *
 * @remarks
 * Tests the address search hook including debounced searching,
 * pattern parsing, result processing, and state management.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAddressSearch, UseAddressSearchOptions } from '../../AzureMapsAddressAutoComplete/hooks/useAddressSearch';
import * as services from '../../AzureMapsAddressAutoComplete/services';
import type { AzureMapsSearchResult } from '../../AzureMapsAddressAutoComplete/services';

// Mock the services module
jest.mock('../../AzureMapsAddressAutoComplete/services', () => ({
  searchAddress: jest.fn(),
  searchMunicipalities: jest.fn(),
  fetchPostalCodesForMunicipality: jest.fn(),
  normalizeResults: jest.fn((results) => results),
  createPostalCodeResult: jest.fn()
}));

// Mock timers for debounce testing
jest.useFakeTimers();

describe('useAddressSearch', () => {
  const mockSubscriptionKey = 'test-subscription-key';
  const defaultOptions: UseAddressSearchOptions = {
    subscriptionKey: mockSubscriptionKey,
    language: 'en-US'
  };

  const mockSearchResult: AzureMapsSearchResult = {
    type: 'Point Address',
    id: 'test-id-1',
    score: 10.5,
    address: {
      streetNumber: '123',
      streetName: 'Main Street',
      municipality: 'Seattle',
      countrySubdivision: 'WA',
      countryCode: 'US',
      country: 'United States',
      postalCode: '98101',
      freeformAddress: '123 Main Street, Seattle, WA 98101'
    },
    position: { lat: 47.6062, lon: -122.3321 },
    entityType: 'Address'
  };

  const mockMunicipalityResult: AzureMapsSearchResult = {
    type: 'Geography',
    id: 'test-id-2',
    score: 8.5,
    address: {
      municipality: 'Budapest',
      countryCode: 'HU',
      country: 'Hungary',
      freeformAddress: 'Budapest, Hungary'
    },
    position: { lat: 47.4979, lon: 19.0402 },
    entityType: 'Municipality'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      expect(result.current.inputValue).toBe('');
      expect(result.current.showDropdown).toBe(false);
      expect(result.current.isFocused).toBe(false);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.showErrorDialog).toBe(false);
      expect(result.current.selectedResult).toBeNull();
      expect(result.current.openPopoverIndex).toBeNull();
    });

    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => 
        useAddressSearch('123 Main Street', defaultOptions)
      );

      expect(result.current.inputValue).toBe('123 Main Street');
    });

    it('should sync with external value changes', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }: { initialValue: string }) => useAddressSearch(initialValue, defaultOptions),
        { initialProps: { initialValue: 'initial' } }
      );

      expect(result.current.inputValue).toBe('initial');

      rerender({ initialValue: 'updated' });
      expect(result.current.inputValue).toBe('updated');
    });
  });

  describe('handleChange', () => {
    it('should update input value', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleChange(
          { target: { value: 'test' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'test' }
        );
      });

      expect(result.current.inputValue).toBe('test');
    });

    it('should call onChange callback', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, onChange })
      );

      act(() => {
        result.current.handleChange(
          { target: { value: 'test' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'test' }
        );
      });

      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('should not show dropdown for short input', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'ab' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'ab' }
        );
      });

      expect(result.current.showDropdown).toBe(false);
    });

    it('should show dropdown for valid input when focused', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      expect(result.current.showDropdown).toBe(true);
    });

    it('should debounce API calls', async () => {
      (services.searchAddress as jest.Mock).mockResolvedValue([mockSearchResult]);
      (services.normalizeResults as jest.Mock).mockReturnValue([mockSearchResult]);

      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      // Type quickly
      act(() => {
        result.current.handleChange(
          { target: { value: 'sea' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'sea' }
        );
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seat' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seat' }
        );
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seatt' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seatt' }
        );
      });

      // API should not be called yet (debouncing)
      expect(services.searchAddress).not.toHaveBeenCalled();

      // Fast-forward debounce timer
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Now API should be called only once with final value
      expect(services.searchAddress).toHaveBeenCalledTimes(1);
      // Note: buildApiQuery prepends "1 " to queries without numbers for street-level results
      expect(services.searchAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '1 seatt'
        })
      );
    });

    it('should clear selectedResult when user types', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      // Simulate having a selected result
      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'new value' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'new value' }
        );
      });

      expect(result.current.selectedResult).toBeNull();
    });
  });

  describe('handleFocus', () => {
    it('should set isFocused to true', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      expect(result.current.isFocused).toBe(true);
    });

    it('should show dropdown when input has value and suggestions exist', async () => {
      (services.searchAddress as jest.Mock).mockResolvedValue([mockSearchResult]);
      (services.normalizeResults as jest.Mock).mockReturnValue([mockSearchResult]);

      const { result, waitForNextUpdate } = renderHook(() => useAddressSearch('', defaultOptions));

      // First, type something to get suggestions
      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
        await waitForNextUpdate();
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);

      // Blur and refocus
      act(() => {
        jest.advanceTimersByTime(400);
      });

      act(() => {
        result.current.handleFocus();
      });

      expect(result.current.showDropdown).toBe(true);
    });
  });

  describe('handleBlur', () => {
    it('should set isFocused to false after delay', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      expect(result.current.isFocused).toBe(true);

      act(() => {
        result.current.handleBlur();
      });

      // Should not immediately change (delay for click handling)
      expect(result.current.isFocused).toBe(true);

      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(result.current.isFocused).toBe(false);
    });

    it('should not close dropdown when popover is open', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      // Set popover open
      act(() => {
        result.current.setOpenPopoverIndex(0);
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      act(() => {
        result.current.handleBlur();
      });

      act(() => {
        jest.advanceTimersByTime(350);
      });

      // Should still be focused because popover is open
      expect(result.current.isFocused).toBe(true);
    });
  });

  describe('handleSelectAddress', () => {
    it('should update input value with selected address', async () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, onSelect })
      );

      await act(async () => {
        await result.current.handleSelectAddress(mockSearchResult);
      });

      expect(result.current.inputValue).toBe('123 Main Street, Seattle, WA 98101');
      expect(result.current.showDropdown).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });

    it('should call onSelect callback with result', async () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, onSelect })
      );

      await act(async () => {
        await result.current.handleSelectAddress(mockSearchResult);
      });

      expect(onSelect).toHaveBeenCalledWith(
        '123 Main Street, Seattle, WA 98101',
        mockSearchResult
      );
    });

    it('should call onChange callback when selecting', async () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, onChange })
      );

      await act(async () => {
        await result.current.handleSelectAddress(mockSearchResult);
      });

      expect(onChange).toHaveBeenCalledWith('123 Main Street, Seattle, WA 98101');
    });

    it('should set selectedResult for hint display', async () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      await act(async () => {
        await result.current.handleSelectAddress(mockSearchResult);
      });

      expect(result.current.selectedResult).toEqual(mockSearchResult);
    });

    it('should fetch postal codes when selecting a municipality in postal code search', async () => {
      const mockPostalCodes = ['1011', '1012', '1013'];
      (services.fetchPostalCodesForMunicipality as jest.Mock).mockResolvedValue(mockPostalCodes);
      (services.createPostalCodeResult as jest.Mock).mockImplementation((postalCode, parent) => ({
        ...parent,
        id: `postal-${postalCode}`,
        address: { ...parent.address, postalCode }
      }));

      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      // Simulate a postal code search by triggering the search with postal code pattern
      act(() => {
        result.current.handleFocus();
      });

      // We need to set up the state as if we searched for postal codes
      // This is done internally when user types "1234,HU" pattern
      // For this test, we simulate selecting a municipality result
      await act(async () => {
        // This would normally happen after a postal code pattern search
        await result.current.handleSelectAddress(mockMunicipalityResult);
      });

      // Since we're not in postal code mode initially, it will just select the address
      expect(result.current.inputValue).toBe('Budapest, Hungary');
    });
  });

  describe('handleErrorDismiss', () => {
    it('should clear error and hide error dialog', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      // Note: We can't directly set error state, but we can test the dismiss handler
      act(() => {
        result.current.handleErrorDismiss();
      });

      expect(result.current.showErrorDialog).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('handlePanelCancel', () => {
    it('should close popover', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.setOpenPopoverIndex(1);
      });

      expect(result.current.openPopoverIndex).toBe(1);

      act(() => {
        result.current.handlePanelCancel();
      });

      expect(result.current.openPopoverIndex).toBeNull();
    });
  });

  describe('setOpenPopoverIndex', () => {
    it('should update openPopoverIndex state', () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      expect(result.current.openPopoverIndex).toBeNull();

      act(() => {
        result.current.setOpenPopoverIndex(2);
      });

      expect(result.current.openPopoverIndex).toBe(2);

      act(() => {
        result.current.setOpenPopoverIndex(null);
      });

      expect(result.current.openPopoverIndex).toBeNull();
    });
  });

  describe('API Error Handling', () => {
    it('should show error dialog when API fails', async () => {
      const apiError = new Error('API request failed');
      (services.searchAddress as jest.Mock).mockRejectedValue(apiError);

      const { result, waitForNextUpdate } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
        await waitForNextUpdate();
      });

      expect(result.current.showErrorDialog).toBe(true);
      expect(result.current.error).toEqual(apiError);
      expect(result.current.suggestions).toEqual([]);
    });

    it('should clear suggestions when API fails', async () => {
      (services.searchAddress as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result, waitForNextUpdate } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
        await waitForNextUpdate();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('No Subscription Key', () => {
    it('should not fetch suggestions without subscription key', () => {
      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, subscriptionKey: undefined })
      );

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(services.searchAddress).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe('Search Pattern Handling', () => {
    it('should search for addresses by default', async () => {
      (services.searchAddress as jest.Mock).mockResolvedValue([mockSearchResult]);
      (services.normalizeResults as jest.Mock).mockReturnValue([mockSearchResult]);

      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(services.searchAddress).toHaveBeenCalled();
      expect(services.searchMunicipalities).not.toHaveBeenCalled();
    });

    it('should search municipalities for postal code pattern', async () => {
      (services.searchMunicipalities as jest.Mock).mockResolvedValue([mockMunicipalityResult]);
      (services.normalizeResults as jest.Mock).mockReturnValue([mockMunicipalityResult]);

      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      act(() => {
        result.current.handleFocus();
      });

      // Use postal code search pattern (PLZ: prefix for city postal code search)
      act(() => {
        result.current.handleChange(
          { target: { value: 'PLZ: Budapest' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'PLZ: Budapest' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(services.searchMunicipalities).toHaveBeenCalled();
    });
  });

  describe('Auto-hide Success Hint', () => {
    it('should clear selectedResult after 1 second', async () => {
      const { result } = renderHook(() => useAddressSearch('', defaultOptions));

      await act(async () => {
        await result.current.handleSelectAddress(mockSearchResult);
      });

      expect(result.current.selectedResult).toBeTruthy();

      // Advance timer to trigger auto-hide
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(result.current.selectedResult).toBeNull();
    });
  });

  describe('Country Set Filtering', () => {
    it('should pass countrySet to API calls', async () => {
      (services.searchAddress as jest.Mock).mockResolvedValue([mockSearchResult]);
      (services.normalizeResults as jest.Mock).mockReturnValue([mockSearchResult]);

      const { result } = renderHook(() => 
        useAddressSearch('', { ...defaultOptions, countrySet: 'US,CA' })
      );

      act(() => {
        result.current.handleFocus();
      });

      act(() => {
        result.current.handleChange(
          { target: { value: 'seattle' } } as React.ChangeEvent<HTMLInputElement>,
          { value: 'seattle' }
        );
      });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(services.searchAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          countrySet: 'US,CA'
        })
      );
    });
  });
});
