import * as React from 'react';
import {
  AzureMapsSearchResult,
  searchAddress,
  searchMunicipalities,
  fetchPostalCodesForMunicipality,
  normalizeResults,
  createPostalCodeResult
} from '../services';
import {
  MIN_CHARS_FOR_SUGGESTIONS,
  DEBOUNCE_DELAY,
  parseSearchPattern,
  buildApiQuery,
  processResultsBySearchType,
  type SearchType
} from '../utils/searchPatternUtils';

/**
 * Configuration options for the useAddressSearch hook.
 */
export interface UseAddressSearchOptions {
  /** Azure Maps subscription key for API authentication. */
  subscriptionKey?: string;
  /** Language code for search results (e.g., 'en-US'). */
  language?: string;
  /** Comma-separated list of country codes (ISO 3166-1 alpha-2) to limit results. */
  countrySet?: string;
  /** Callback when the address value changes. */
  onChange?: (value: string) => void;
  /** Callback when an address is selected from suggestions. */
  onSelect?: (address: string, result?: AzureMapsSearchResult) => void;
}

/**
 * Return type for the useAddressSearch hook.
 */
export interface UseAddressSearchReturn {
  /** Current input value. */
  inputValue: string;
  /** Whether the dropdown should be shown. */
  showDropdown: boolean;
  /** Whether the input is focused. */
  isFocused: boolean;
  /** List of address suggestions. */
  suggestions: AzureMapsSearchResult[];
  /** Whether a search is in progress. */
  isLoading: boolean;
  /** Current error, if any. */
  error: Error | null;
  /** Whether the error dialog should be shown. */
  showErrorDialog: boolean;
  /** The currently selected result for hint display. */
  selectedResult: AzureMapsSearchResult | null;
  /** Index of the currently open popover, or null. */
  openPopoverIndex: number | null;
  /** Sets the open popover index. */
  setOpenPopoverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  /** Handles input value changes. */
  handleChange: (event: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => void;
  /** Handles input focus. */
  handleFocus: () => void;
  /** Handles input blur. */
  handleBlur: () => void;
  /** Handles address selection from dropdown. */
  handleSelectAddress: (result: AzureMapsSearchResult) => Promise<void>;
  /** Dismisses the error dialog. */
  handleErrorDismiss: () => void;
  /** Handles panel cancel - keeps dropdown open. */
  handlePanelCancel: () => void;
}

/**
 * Custom hook that encapsulates all address search state and logic.
 * Provides debounced search, pattern parsing, and result processing.
 *
 * @param initialValue - Initial value for the input field.
 * @param options - Configuration options for the search.
 * @returns Object containing state values and handler functions.
 *
 * @example
 * ```tsx
 * const {
 *   inputValue,
 *   suggestions,
 *   isLoading,
 *   handleChange,
 *   handleSelectAddress
 * } = useAddressSearch('', {
 *   subscriptionKey: 'your-key',
 *   language: 'en-US',
 *   onSelect: (address, result) => console.log(address)
 * });
 * ```
 */
export function useAddressSearch(
  initialValue: string,
  options: UseAddressSearchOptions
): UseAddressSearchReturn {
  const {
    subscriptionKey,
    language = 'en-US',
    countrySet,
    onChange,
    onSelect
  } = options;

  // State
  const [inputValue, setInputValue] = React.useState<string>(initialValue);
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [isFocused, setIsFocused] = React.useState<boolean>(false);
  const [suggestions, setSuggestions] = React.useState<AzureMapsSearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentSearchType, setCurrentSearchType] = React.useState<SearchType>('address');
  const [error, setError] = React.useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = React.useState<boolean>(false);
  const [selectedResult, setSelectedResult] = React.useState<AzureMapsSearchResult | null>(null);
  const [openPopoverIndex, setOpenPopoverIndex] = React.useState<number | null>(null);
  
  // Refs
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepDropdownOpenRef = React.useRef<boolean>(false);

  /**
   * Handles dismissing the error dialog.
   */
  const handleErrorDismiss = React.useCallback((): void => {
    setShowErrorDialog(false);
    setError(null);
  }, []);

  /**
   * Wrapper to fetch postal codes using the service.
   */
  const getPostalCodesForMunicipality = React.useCallback(async (
    municipalityName: string,
    countryCode: string,
    position: { lat: number; lon: number }
  ): Promise<string[]> => {
    if (!subscriptionKey) {
      return [];
    }
    return fetchPostalCodesForMunicipality(subscriptionKey, municipalityName, countryCode, position, language);
  }, [subscriptionKey, language]);

  /**
   * Fetches address suggestions from Azure Maps Search API.
   */
  const fetchSuggestions = React.useCallback(async (inputValue: string): Promise<void> => {
    if (!subscriptionKey) {
      setSuggestions([]);
      return;
    }

    // Parse search pattern to get query, country set, and search type
    const { query: searchQuery, countrySet: effectiveCountrySet, searchType } = parseSearchPattern(inputValue, countrySet);
    
    // Track the current search type for selection handling
    setCurrentSearchType(searchType);

    // Validate minimum query length
    if (searchQuery.length <= MIN_CHARS_FOR_SUGGESTIONS) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const apiQuery = buildApiQuery(searchQuery, searchType);

      // Fetch results using the service layer
      const rawResults = searchType === 'postalcode'
        ? await searchMunicipalities({
            subscriptionKey,
            query: apiQuery,
            language,
            countrySet: effectiveCountrySet,
            limit: 100
          })
        : await searchAddress({
            subscriptionKey,
            query: apiQuery,
            language,
            countrySet: effectiveCountrySet,
            limit: 100
          });

      // Normalize results - extract postal code from various fields if not directly available
      const normalizedResults = normalizeResults(rawResults);

      // Process results based on search type
      const finalResults = await processResultsBySearchType(
        normalizedResults,
        searchType,
        searchQuery,
        effectiveCountrySet,
        getPostalCodesForMunicipality
      );

      setSuggestions(finalResults);
    } catch (err) {
      console.error('Error fetching address suggestions:', err);
      setSuggestions([]);
      
      // Show error dialog for errors
      if (err instanceof Error) {
        setError(err);
        setShowErrorDialog(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionKey, language, countrySet, getPostalCodesForMunicipality]);

  /**
   * Handles input value changes with debouncing.
   */
  const handleChange = React.useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    data: { value: string }
  ): void => {
    setInputValue(data.value);
    setSelectedResult(null); // Clear hint when user types
    onChange?.(data.value);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (data.value.length > MIN_CHARS_FOR_SUGGESTIONS && isFocused) {
      setShowDropdown(true);
      // Debounce API call
      debounceTimerRef.current = setTimeout(() => {
        void fetchSuggestions(data.value);
      }, DEBOUNCE_DELAY);
    } else {
      setShowDropdown(false);
      setSuggestions([]);
    }
  }, [isFocused, onChange, fetchSuggestions]);

  /**
   * Handles selection of an address from the dropdown.
   */
  const handleSelectAddress = React.useCallback(async (result: AzureMapsSearchResult): Promise<void> => {
    // If this is a postal code search and the result is a Municipality,
    // fetch the postal codes and display them as new suggestions
    if (currentSearchType === 'postalcode' && result.entityType === 'Municipality' && result.position) {
      setIsLoading(true);
      const municipalityName = result.address.municipality ?? '';
      const countryCode = result.address.countryCode ?? '';
      const postalCodes = await getPostalCodesForMunicipality(municipalityName, countryCode, result.position);
      
      if (postalCodes.length > 0) {
        // Create results for each postal code using the service helper
        const postalCodeResults = postalCodes.map((postalCode) => 
          createPostalCodeResult(postalCode, result)
        );
        
        setSuggestions(postalCodeResults);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }
    
    // Standard address selection
    const address = result.address.freeformAddress;
    setInputValue(address);
    setShowDropdown(false);
    setSuggestions([]);
    setSelectedResult(result); // Store for hint display
    onChange?.(address);
    onSelect?.(address, result);
  }, [currentSearchType, getPostalCodesForMunicipality, onChange, onSelect]);

  /**
   * Handles input focus event.
   */
  const handleFocus = React.useCallback((): void => {
    setIsFocused(true);
    if (inputValue.length > MIN_CHARS_FOR_SUGGESTIONS && suggestions.length > 0) {
      setShowDropdown(true);
    }
  }, [inputValue.length, suggestions.length]);

  /**
   * Handles input blur event.
   */
  const handleBlur = React.useCallback((): void => {
    // Delay hiding to allow click on dropdown items
    setTimeout(() => {
      // Don't close dropdown if a popover is open or keepDropdownOpen flag is set
      if (openPopoverIndex !== null || keepDropdownOpenRef.current) {
        keepDropdownOpenRef.current = false; // Reset the flag
        return;
      }
      setIsFocused(false);
      setShowDropdown(false);
    }, 300);
  }, [openPopoverIndex]);

  /**
   * Handles panel cancel - keeps dropdown open after panel closes.
   */
  const handlePanelCancel = React.useCallback((): void => {
    keepDropdownOpenRef.current = true;
    setOpenPopoverIndex(null);
  }, []);

  // Sync with external value changes
  React.useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Auto-hide success hint after 1 second
  React.useEffect(() => {
    if (selectedResult) {
      const timer = setTimeout(() => {
        setSelectedResult(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedResult]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    inputValue,
    showDropdown,
    isFocused,
    suggestions,
    isLoading,
    error,
    showErrorDialog,
    selectedResult,
    openPopoverIndex,
    setOpenPopoverIndex,
    handleChange,
    handleFocus,
    handleBlur,
    handleSelectAddress,
    handleErrorDismiss,
    handlePanelCancel
  };
}
