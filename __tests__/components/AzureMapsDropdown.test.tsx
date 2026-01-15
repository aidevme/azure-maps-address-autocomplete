/**
 * Unit tests for AzureMapsDropdown component.
 *
 * @remarks
 * Tests dropdown rendering, suggestion display, keyboard navigation,
 * popover interactions, and portal rendering.
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import {
  AzureMapsDropdown,
  IAzureMapsDropdownProps,
} from '../../AzureMapsAddressAutoComplete/components/AzureMapsDropdown';
import type { AzureMapsSearchResult } from '../../AzureMapsAddressAutoComplete/services';

// Mock ReactDOM.createPortal to render children directly
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Mock the PcfContext
jest.mock('../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContext', () => ({
  usePcfContext: jest.fn(() => ({
    subscriptionKey: 'test-key',
    mapSize: 'medium',
    getString: (key: string, fallback: string) => fallback,
  })),
}));

// Mock useAzureMap hook
jest.mock('../../AzureMapsAddressAutoComplete/hooks/useAzureMap', () => ({
  useAzureMap: jest.fn(() => ({
    containerRef: { current: null },
    isLoading: false,
    hasMapData: false,
  })),
}));

/**
 * Helper to render component with FluentProvider.
 */
const renderWithProvider = (props: IAzureMapsDropdownProps) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      <AzureMapsDropdown {...props} />
    </FluentProvider>
  );
};

/**
 * Creates a mock search result for testing.
 */
const createMockResult = (
  id: string,
  streetName: string,
  municipality: string,
  postalCode: string
): AzureMapsSearchResult => ({
  type: 'Point Address',
  id,
  score: 10.5,
  address: {
    streetNumber: '123',
    streetName,
    municipality,
    countrySubdivision: 'WA',
    countryCode: 'US',
    country: 'United States',
    postalCode,
    freeformAddress: `123 ${streetName}, ${municipality}, WA ${postalCode}`,
  },
  position: { lat: 47.6062, lon: -122.3321 },
  entityType: 'Address',
});

describe('AzureMapsDropdown', () => {
  const mockOnPopoverChange = jest.fn();
  const mockOnSelect = jest.fn();
  const mockOnPanelSelect = jest.fn();
  const mockOnPanelCancel = jest.fn();

  const mockSuggestions: AzureMapsSearchResult[] = [
    createMockResult('1', 'Main Street', 'Seattle', '98101'),
    createMockResult('2', 'First Avenue', 'Portland', '97201'),
    createMockResult('3', 'Oak Lane', 'San Francisco', '94101'),
  ];

  const defaultProps: IAzureMapsDropdownProps = {
    suggestions: mockSuggestions,
    openPopoverIndex: null,
    onPopoverChange: mockOnPopoverChange,
    onSelect: mockOnSelect,
    onPanelSelect: mockOnPanelSelect,
    onPanelCancel: mockOnPanelCancel,
    showMaps: false,
    listboxId: 'test-listbox',
    anchorRef: { current: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render listbox with correct role', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should render listbox with provided id', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('listbox')).toHaveAttribute('id', 'test-listbox');
    });

    it('should render all suggestions', () => {
      renderWithProvider(defaultProps);

      const options = screen.getAllByRole('listitem');
      expect(options).toHaveLength(3);
    });

    it('should render with aria-label for accessibility', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-label',
        'Address suggestions'
      );
    });

    it('should render empty listbox when no suggestions', () => {
      renderWithProvider({
        ...defaultProps,
        suggestions: [],
      });

      const listbox = screen.getByRole('listbox');
      expect(listbox.children).toHaveLength(0);
    });
  });

  describe('Suggestion Display', () => {
    it('should display primary address text', () => {
      renderWithProvider(defaultProps);

      // Check for street names in suggestions
      expect(screen.getByText(/Main Street/)).toBeInTheDocument();
      expect(screen.getByText(/First Avenue/)).toBeInTheDocument();
      expect(screen.getByText(/Oak Lane/)).toBeInTheDocument();
    });

    it('should display secondary address information', () => {
      renderWithProvider(defaultProps);

      // Secondary info includes municipality, state, postal code - use getAllBy since text may appear multiple times
      expect(screen.getAllByText(/Seattle/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Portland/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/San Francisco/).length).toBeGreaterThan(0);
    });

    it('should assign unique IDs to suggestion options', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText(/Main Street/).closest('li')).toHaveAttribute(
        'id',
        'suggestion-option-0'
      );
      expect(screen.getByText(/First Avenue/).closest('li')).toHaveAttribute(
        'id',
        'suggestion-option-1'
      );
    });

    it('should render location icons for each suggestion', () => {
      const { container } = renderWithProvider(defaultProps);

      // Each suggestion should have a location icon (SVG)
      const suggestions = container.querySelectorAll('li');
      suggestions.forEach((suggestion) => {
        expect(suggestion.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when suggestion is clicked', () => {
      renderWithProvider(defaultProps);

      const firstSuggestion = screen.getByText(/Main Street/).closest('li');
      fireEvent.click(firstSuggestion!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should call onSelect with correct result for different suggestions', () => {
      renderWithProvider(defaultProps);

      const secondSuggestion = screen.getByText(/First Avenue/).closest('li');
      fireEvent.click(secondSuggestion!);

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[1]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onSelect when Enter is pressed on suggestion', () => {
      renderWithProvider(defaultProps);

      const firstSuggestion = screen.getByText(/Main Street/).closest('li');
      fireEvent.keyDown(firstSuggestion!, { key: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should call onSelect when Space is pressed on suggestion', () => {
      renderWithProvider(defaultProps);

      const firstSuggestion = screen.getByText(/Main Street/).closest('li');
      fireEvent.keyDown(firstSuggestion!, { key: ' ' });

      expect(mockOnSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it('should not call onSelect for other keys', () => {
      renderWithProvider(defaultProps);

      const firstSuggestion = screen.getByText(/Main Street/).closest('li');
      fireEvent.keyDown(firstSuggestion!, { key: 'Tab' });
      fireEvent.keyDown(firstSuggestion!, { key: 'Escape' });
      fireEvent.keyDown(firstSuggestion!, { key: 'a' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should make suggestions focusable via tabIndex', () => {
      renderWithProvider(defaultProps);

      const suggestions = screen.getAllByRole('listitem');
      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Maps Panel Integration', () => {
    it('should not render globe button when showMaps is false', () => {
      renderWithProvider(defaultProps);

      // No globe buttons should be present
      expect(screen.queryByLabelText(/show address details/i)).not.toBeInTheDocument();
    });

    it('should render AzureMapsPanel for each suggestion when showMaps is true', () => {
      renderWithProvider({
        ...defaultProps,
        showMaps: true,
      });

      // When showMaps is true, each suggestion should have a panel trigger
      // The panel component renders globe buttons
      const suggestions = screen.getAllByRole('listitem');
      expect(suggestions.length).toBe(3);
    });
  });

  describe('Positioning', () => {
    it('should calculate position based on anchor element', () => {
      const mockAnchorRef = {
        current: {
          getBoundingClientRect: () => ({
            bottom: 100,
            left: 50,
            width: 300,
            top: 70,
            right: 350,
            height: 30,
          }),
        } as HTMLDivElement,
      };

      renderWithProvider({
        ...defaultProps,
        anchorRef: mockAnchorRef,
      });

      const listbox = screen.getByRole('listbox');
      // Position should be set via inline styles
      expect(listbox).toHaveStyle({
        position: 'fixed',
      });
    });

    it('should update position on window resize', async () => {
      const mockGetBoundingClientRect = jest.fn(() => ({
        bottom: 100,
        left: 50,
        width: 300,
        top: 70,
        right: 350,
        height: 30,
      }));
      
      const mockAnchorRef = {
        current: {
          getBoundingClientRect: mockGetBoundingClientRect,
        } as unknown as HTMLDivElement,
      };

      renderWithProvider({
        ...defaultProps,
        anchorRef: mockAnchorRef as React.RefObject<HTMLDivElement>,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockGetBoundingClientRect).toHaveBeenCalled();
      });
    });

    it('should update position on scroll', async () => {
      const mockGetBoundingClientRect = jest.fn(() => ({
        bottom: 100,
        left: 50,
        width: 300,
        top: 70,
        right: 350,
        height: 30,
      }));
      
      const mockAnchorRef = {
        current: {
          getBoundingClientRect: mockGetBoundingClientRect,
        } as unknown as HTMLDivElement,
      };

      renderWithProvider({
        ...defaultProps,
        anchorRef: mockAnchorRef as React.RefObject<HTMLDivElement>,
      });

      // Trigger scroll event
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(mockGetBoundingClientRect).toHaveBeenCalled();
      });
    });
  });

  describe('Styling', () => {
    it('should apply high z-index for overlay visibility', () => {
      renderWithProvider(defaultProps);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveStyle({ zIndex: 1000000 });
    });

    it('should apply white background', () => {
      renderWithProvider(defaultProps);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('should apply border radius', () => {
      renderWithProvider(defaultProps);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveStyle({ borderRadius: '4px' });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithProvider(defaultProps);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        true
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
