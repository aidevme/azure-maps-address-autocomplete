// AzureMapsAddressAutoComplete\components\AzureMapsAddressAutoComplete.tsx
import * as React from "react";
import {
  Input,
  Spinner,
  useId,
  Button,
  type ButtonProps,
} from "@fluentui/react-components";
import { Icons } from "../utils/iconRegistry";
import { useAzureMapsAddressAutoCompleteStyles } from "../styles";
import { AzureMapsAddressDialog } from "./AzureMapsAddressDialog";
import { AzureMapsClearConfirmationDialog } from "./AzureMapsClearConfirmationDialog";
import { AzureMapsDropdown } from "./AzureMapsDropdown";
import { useAddressSearch } from "../hooks";
import type { AzureMapsSearchResult } from "../services";
import type { PcfContextService } from "../services/PcfContext/PcfContextService";

// Re-export for backwards compatibility and external use
export type { AzureMapsSearchResult } from "../services";

/**
 * Cached address data for undo functionality.
 */
interface CachedAddressData {
  /** The formatted address string. */
  address: string;
  /** The full Azure Maps search result with all address components. */
  result: AzureMapsSearchResult | undefined;
}

/**
 * Search button component for the address input field.
 */
const SearchButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      appearance="transparent"
      icon={<Icons.SearchRegular primaryFill="#616161" />}
      size="small"
      aria-label="Search"
    />
  );
};

/**
 * Clear button component for clearing the input field.
 */
const ClearButton: React.FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      appearance="transparent"
      icon={<Icons.DismissRegular primaryFill="#616161" />}
      size="small"
      aria-label="Clear"
    />
  );
};

/**
 * Props for the AzureMapsAddressAutoComplete component.
 */
export interface IAzureMapsAddressAutoCompleteProps {
  /** The current value of the address field. */
  value?: string;
  /** Placeholder text for the input field. */
  placeholder?: string;
  /** Language code for search results (e.g., 'en-US'). */
  language?: string;  
  /** Callback when the address value changes. */
  onChange?: (value: string) => void;
  /** Callback when an address is selected from suggestions. */
  onSelect?: (address: string, result?: AzureMapsSearchResult) => void;
  /** PCF context service for accessing platform context. */
  pcfContext?: PcfContextService;
}

/**
 * Azure Maps Address AutoComplete component.
 * Provides an input field for address autocomplete functionality.
 *
 * @param props - The component props.
 * @returns The rendered React element.
 */
export const AzureMapsAddressAutoComplete: React.FC<
  IAzureMapsAddressAutoCompleteProps
> = (props) => {
  const {
    value = "",
    placeholder,
    language = "en-US",
    onChange,
    onSelect,
    pcfContext,
  } = props;
  const styles = useAzureMapsAddressAutoCompleteStyles();

  // State for clear confirmation dialog
  const [showClearDialog, setShowClearDialog] = React.useState(false);

  // State to show hint when address is cleared
  const [showClearedHint, setShowClearedHint] = React.useState(false);

  // Ref to store the last selected address data for undo
  const lastSelectionRef = React.useRef<CachedAddressData | null>(null);

  // Ref for the root container to position dropdown
  const rootRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Generate unique IDs for accessibility
  const listboxId = useId("address-suggestions-listbox");
  const inputId = useId("address-input");
  const afterId = useId("content-after");

  // Get disabled state from pcfContext
  const disabled = pcfContext?.disabled ?? false;

  // Get localized placeholder from resources or use default
  const localizedPlaceholder =
    placeholder ??
    pcfContext?.getString(
      "azure-maps-address-auto-complete-address-input-placeholder",
      "Enter an address..."
    ) ??
    "Enter an address...";

  // Get localized hint text from resources
  const addressSelectedHint =
    pcfContext?.getString(
      "azure-maps-address-auto-address-selected-hint",
      "Address Successfully Selected"
    ) ?? "Address Successfully Selected";

  const addressClearedHint =
    pcfContext?.getString(
      "azure-maps-address-auto-complete-address-cleared-hint",
      "Address Successfully Cleared"
    ) ?? "Address Successfully Cleared";

  const showMaps = pcfContext?.showMaps ?? false;
  const useUserLanguage = pcfContext?.useUserLanguage ?? false;
  const uiLanguage = pcfContext?.uiLanguage ?? "en-US";
  const defaultLanguage = pcfContext?.defaultLanguage ?? "en-US";
  const subscriptionKey = pcfContext?.subscriptionKey ?? "";
  const countrySet = pcfContext?.defaultCountries ?? undefined;

  // Determine the search language: use user's UI language if enabled, otherwise use configured default
  // Falls back to prop value or "en-US" if PCF context is not available
  const searchLanguage = pcfContext
    ? useUserLanguage
      ? uiLanguage
      : defaultLanguage
    : language ?? "en-US";

  /**
   * Wrapped onSelect callback that caches the selection for undo functionality.
   */
  const handleSelectWithCache = React.useCallback(
    (address: string, result?: AzureMapsSearchResult) => {
      // Cache the selection for potential undo
      if (result) {
        lastSelectionRef.current = {
          address: address,
          result: result,
        };
      }
      // Hide cleared hint when new selection is made
      setShowClearedHint(false);
      // Call the original onSelect
      onSelect?.(address, result);
    },
    [onSelect]
  );

  // Use custom hook for all search state and logic
  const {
    inputValue,
    showDropdown,
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
    handlePanelCancel,
  } = useAddressSearch(value, {
    subscriptionKey,
    language: searchLanguage,
    countrySet,
    onChange,
    onSelect: handleSelectWithCache,
  });

  /**
   * Wrapper to handle async address selection without returning a promise.
   */
  const onSelectAddress = React.useCallback(
    (result: AzureMapsSearchResult): void => {
      void handleSelectAddress(result);
    },
    [handleSelectAddress]
  );

  /**
   * Handler for search button click.
   */
  const handleSearchClick = React.useCallback(() => {
    // Trigger search with current input value
    console.log("Search button clicked, inputValue:", inputValue);
    // TODO: Add search trigger logic here
  }, [inputValue]);

  /**
   * Handler for clear button click - shows confirmation dialog.
   */
  const handleClearClick = React.useCallback(() => {
    setShowClearDialog(true);
  }, []);

  /**
   * Handler for confirming clear action from the dialog.
   */
  const handleClearConfirm = React.useCallback(() => {
    // Clear the input value and all address fields
    onChange?.("");
    onSelect?.("", undefined); // Clears all address fields in index.ts
    setShowClearDialog(false);
    setShowClearedHint(true);
  }, [onChange, onSelect]);

  /**
   * Handler for canceling clear action from the dialog.
   */
  const handleClearCancel = React.useCallback(() => {
    setShowClearDialog(false);
  }, []);

  // Auto-hide cleared hint after 1 second
  React.useEffect(() => {
    if (showClearedHint) {
      const timer = setTimeout(() => {
        setShowClearedHint(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showClearedHint]);

  return (
    <div ref={containerRef} className={styles.root}>
      <div ref={rootRef} style={{ width: "100%" }}>
        <Input
          id={inputId}
          className={styles.input}
          style={{ display: "flex" }}
          value={inputValue}
          placeholder={localizedPlaceholder}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          contentAfter={
            isLoading ? (
              <Spinner size="tiny" id={afterId} />
            ) : inputValue ? (
              <ClearButton
                id={afterId}
                disabled={disabled}
                onClick={handleClearClick}
              />
            ) : (
              <SearchButton
                id={afterId}
                disabled={disabled}
                onClick={handleSearchClick}
              />
            )
          }
          appearance="filled-darker"
          size="medium"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-autocomplete="list"
        />
      </div>
      {selectedResult && (
        <div className={styles.hint}>{addressSelectedHint}</div>
      )}
      {showClearedHint && (
        <div className={styles.hint} style={{ color: '#d13438' }}>{addressClearedHint}</div>
      )}
      {showDropdown && (suggestions.length > 0 || isLoading) && (
        <AzureMapsDropdown
          suggestions={suggestions}
          openPopoverIndex={openPopoverIndex}
          onPopoverChange={setOpenPopoverIndex}
          onSelect={onSelectAddress}
          onPanelSelect={onSelectAddress}
          onPanelCancel={handlePanelCancel}
          showMaps={showMaps}
          listboxId={listboxId}
          anchorRef={rootRef}
        />
      )}
      <AzureMapsAddressDialog
        open={showErrorDialog}
        error={error}
        onDismiss={handleErrorDismiss}
      />
      <AzureMapsClearConfirmationDialog
        open={showClearDialog}
        pcfContext={pcfContext}
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
      />
    </div>
  );
};
