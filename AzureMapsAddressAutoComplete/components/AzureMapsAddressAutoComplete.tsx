// AzureMapsAddressAutoComplete\components\AzureMapsAddressAutoComplete.tsx
import * as React from "react";
import { Input, Spinner, useId } from "@fluentui/react-components";
import { Icons } from "../utils/iconRegistry";
import { useAzureMapsAddressAutoCompleteStyles } from "../styles";
import { AzureMapsAddressDialog } from "./AzureMapsAddressDialog";
import { AzureMapsDropdown } from "./AzureMapsDropdown";
import { useAddressSearch } from "../hooks";
import type { AzureMapsSearchResult } from "../services";
import type { PcfContextService } from "../services/PcfContext/PcfContextService";

// Re-export for backwards compatibility and external use
export type { AzureMapsSearchResult } from "../services";

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
  /** Width of the control in pixels. If not specified, uses 100%. */
  width?: number;
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
    width,
    onChange,
    onSelect,
    pcfContext,
  } = props;
  const styles = useAzureMapsAddressAutoCompleteStyles();

  // TODO: Remove after testing - Temporary testing: log countries
  //console.log("pcfContext.countries:", pcfContext?.countries);

  // Generate unique IDs for accessibility
  const listboxId = useId("address-suggestions-listbox");
  const inputId = useId("address-input");

  // Get disabled state from pcfContext
  const disabled = pcfContext?.disabled ?? false;

  // Get width from props or pcfContext, fallback to 100%
  const allocatedWidth = width ?? pcfContext?.allocatedWidth;
  const controlWidth = allocatedWidth && allocatedWidth > 0 ? `${allocatedWidth}px` : '100%';

  // Get localized placeholder from resources or use default
  const localizedPlaceholder =
    placeholder ??
    pcfContext?.getString(
      "addressInputPlaceholder_Key",
      "Enter an address..."
    ) ??
    "Enter an address...";

  // Get localized hint text from resources
  const addressSelectedHint =
    pcfContext?.getString(
      "addressSelectedHint_Key",
      "Address Successfully Selected"
    ) ?? "Address Successfully Selected";

  const showMaps = pcfContext?.showMaps ?? false;
  const useUserLanguage = pcfContext?.useUserLanguage ?? false;
  const uiLanguage = pcfContext?.uiLanguage ?? "en-US";
  const defaultLanguage = pcfContext?.defaultLanguage ?? "en-US";  
  const subscriptionKey = pcfContext?.subscriptionKey ?? "";
  const countrySet = pcfContext?.defaultCountries ?? undefined;

  // Determine the search language: use user's UI language if enabled, otherwise use configured default
  // Falls back to prop value or "en-US" if PCF context is not available
  const searchLanguage = pcfContext 
    ? (useUserLanguage ? uiLanguage : defaultLanguage)
    : (language ?? "en-US");

  // Ref for the root container to position dropdown
  const rootRef = React.useRef<HTMLDivElement>(null);

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
    onSelect,
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

  return (
    <div className={styles.root} style={{ width: controlWidth }}>
      <div ref={rootRef} style={{ width: '100%' }}>
        <Input
          id={inputId}
          className={styles.input}
          value={inputValue}
          placeholder={localizedPlaceholder}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          contentAfter={
            isLoading ? (
              <Spinner size="tiny" />
            ) : (
              <span className={styles.searchIcon}>
                <Icons.SearchRegular />
              </span>
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
    </div>
  );
};
