import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '../utils/iconRegistry';
import { useAzureMapsAddressAutoCompleteStyles } from '../styles';
import { AzureMapsPanel } from './AzureMapsPanel';
import { formatPrimaryAddress, formatSecondaryAddress } from '../utils';
import type { AzureMapsSearchResult } from '../services';

/**
 * Props for the AzureMapsDropdown component.
 */
export interface IAzureMapsDropdownProps {
  /** List of address suggestions to display. */
  suggestions: AzureMapsSearchResult[];
  /** Index of the currently open popover, or null if none. */
  openPopoverIndex: number | null;
  /** Callback when popover open state changes. */
  onPopoverChange: (index: number | null) => void;
  /** Callback when an address is selected (from list or panel). */
  onSelect: (result: AzureMapsSearchResult) => void;
  /** Callback when panel Select button is clicked - selects and closes dropdown. */
  onPanelSelect?: (result: AzureMapsSearchResult) => void;
  /** Callback when panel Cancel button is clicked - closes panel only. */
  onPanelCancel?: () => void;
  /** Whether to show maps/globe icon. */
  showMaps?: boolean;
  /** Unique ID for the listbox element (for accessibility). */
  listboxId?: string;
  /** Reference to the anchor element for positioning. */
  anchorRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Dropdown component for displaying address suggestions.
 * Renders a list of selectable address options with popovers for details.
 * Uses a React Portal to render outside the PCF container to avoid overflow clipping.
 *
 * @param props - The component props.
 * @returns The rendered dropdown element.
 */
export const AzureMapsDropdown: React.FC<IAzureMapsDropdownProps> = ({
  suggestions,
  openPopoverIndex,
  onPopoverChange,
  onSelect,
  onPanelSelect,
  onPanelCancel,
  showMaps = false,
  listboxId,
  anchorRef
}) => {
  const styles = useAzureMapsAddressAutoCompleteStyles();
  const [position, setPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);

  // Calculate position based on anchor element
  const updatePosition = React.useCallback(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 2, // Add 2px gap between input and dropdown
        left: rect.left,
        width: rect.width
      });
    }
  }, [anchorRef]);

  // Update position when suggestions change or on mount
  React.useEffect(() => {
    updatePosition();
  }, [updatePosition, suggestions]);

  // Update position on window resize/scroll
  React.useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  /**
   * Handles keyboard navigation and selection.
   */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, result: AzureMapsSearchResult) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(result);
      }
    },
    [onSelect]
  );

  const dropdownContent = (
    <ul
      className={styles.dropdown}
      id={listboxId}
      role="listbox"
      aria-label="Address suggestions"
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        width: position?.width ?? 'auto',
        zIndex: 1000000, // High but below Fluent UI Dialog overlay (typically 1000000+)
        backgroundColor: '#ffffff',
        maxHeight: '300px',
        overflowY: 'auto',
        boxShadow: '0 0 2px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.14)',
        borderRadius: '4px',
        border: '1px solid #d1d1d1',
        margin: 0,
        padding: '4px',
        listStyle: 'none',
        fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      {suggestions.map((result, index) => (
        <li
          key={`suggestion-${index}`}
          className={styles.suggestionItem}
          id={`suggestion-option-${index}`}
          tabIndex={0}
          onClick={() => onSelect(result)}
          onKeyDown={(e) => handleKeyDown(e, result)}
        >
          <Icons.LocationRegular className={styles.suggestionIcon} />
          <div className={styles.suggestionContent}>
            <span className={styles.suggestionText}>
              {formatPrimaryAddress(result.address)}
            </span>
            <span className={styles.suggestionSecondary}>
              {formatSecondaryAddress(result.address, result.score, result.position?.lat, result.position?.lon)}
            </span>
          </div>
          {showMaps && (
            <AzureMapsPanel
              result={result}
              open={openPopoverIndex === index}
              onOpenChange={(open) => onPopoverChange(open ? index : null)}
              onSelect={(selectedResult) => {
                // Select button: update input and close dropdown
                onPanelSelect?.(selectedResult);
              }}
              onCancel={() => {
                // Cancel button: close panel only, dropdown stays open
                onPopoverChange(null);
                onPanelCancel?.();
              }}
              latitude={result.position?.lat}
              longitude={result.position?.lon}
            />
          )}
        </li>
      ))}
    </ul>
  );

  // Use portal to render dropdown in document.body to escape overflow:hidden containers
  return ReactDOM.createPortal(dropdownContent, document.body);
};
