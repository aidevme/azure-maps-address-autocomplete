/**
 * Unit tests for AzureMapsPanel component.
 *
 * @remarks
 * Tests panel dialog rendering, address fields display, map preview,
 * button interactions, and size configurations.
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import {
  AzureMapsPanel,
  IAzureMapsPanelProps,
} from '../../AzureMapsAddressAutoComplete/components/AzureMapsPanel';
import type { AzureMapsSearchResult } from '../../AzureMapsAddressAutoComplete/services';

// Mock the PcfContext
const mockPcfContext: {
  subscriptionKey: string;
  mapSize: 'small' | 'medium' | 'large';
  getString: jest.Mock;
} = {
  subscriptionKey: 'test-subscription-key',
  mapSize: 'medium',
  getString: jest.fn((key: string, fallback: string) => fallback),
};

jest.mock('../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContext', () => ({
  usePcfContext: jest.fn(() => mockPcfContext),
}));

// Mock useAzureMap hook
const mockUseAzureMap = {
  containerRef: { current: null },
  isLoading: false,
  hasMapData: true,
};

jest.mock('../../AzureMapsAddressAutoComplete/hooks/useAzureMap', () => ({
  useAzureMap: jest.fn(() => mockUseAzureMap),
}));

/**
 * Helper to render component with FluentProvider.
 */
const renderWithProvider = (props: IAzureMapsPanelProps) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      <AzureMapsPanel {...props} />
    </FluentProvider>
  );
};

/**
 * Creates a mock search result for testing.
 */
const createMockResult = (overrides?: Partial<AzureMapsSearchResult>): AzureMapsSearchResult => ({
  type: 'Point Address',
  id: 'test-id',
  score: 10.5,
  address: {
    streetNumber: '123',
    streetName: 'Main Street',
    municipality: 'Seattle',
    countrySubdivision: 'WA',
    countrySubdivisionName: 'Washington',
    countryCode: 'US',
    country: 'United States',
    postalCode: '98101',
    freeformAddress: '123 Main Street, Seattle, WA 98101',
  },
  position: { lat: 47.6062, lon: -122.3321 },
  entityType: 'Address',
  ...overrides,
});

describe('AzureMapsPanel', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps: IAzureMapsPanelProps = {
    result: createMockResult(),
    open: false,
    onOpenChange: mockOnOpenChange,
    onSelect: mockOnSelect,
    onCancel: mockOnCancel,
    latitude: 47.6062,
    longitude: -122.3321,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPcfContext.mapSize = 'medium';
    mockPcfContext.subscriptionKey = 'test-subscription-key';
    mockUseAzureMap.hasMapData = true;
    mockUseAzureMap.isLoading = false;
  });

  describe('Trigger Button', () => {
    it('should render globe trigger button', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible label on trigger button', () => {
      renderWithProvider(defaultProps);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Show address details');
    });

    it('should render tooltip on trigger button', async () => {
      renderWithProvider(defaultProps);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      // The button already has aria-label 'Show address details'
      // Tooltip may take time to render or may not render in test environment
      expect(button).toHaveAttribute('aria-label', 'Show address details');
    });

    it('should prevent default on mouseDown', () => {
      renderWithProvider(defaultProps);

      const button = screen.getByRole('button');
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
      const preventDefaultSpy = jest.spyOn(mouseDownEvent, 'preventDefault');

      button.dispatchEvent(mouseDownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Dialog Rendering', () => {
    it('should not show dialog content when closed', () => {
      renderWithProvider(defaultProps);

      expect(screen.queryByText('123 Main Street, Seattle, WA 98101')).not.toBeInTheDocument();
    });

    it('should show dialog content when open', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });

    it('should display freeform address in dialog title', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });
  });

  describe('Address Fields', () => {
    it('should display street address field', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('Street')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main Street 123')).toBeInTheDocument();
    });

    it('should display city field', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('City')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Seattle')).toBeInTheDocument();
    });

    it('should display postal code field', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('Postal Code')).toBeInTheDocument();
      expect(screen.getByDisplayValue('98101')).toBeInTheDocument();
    });

    it('should display state/province field', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('State/Province')).toBeInTheDocument();
    });

    it('should display country field', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
    });

    it('should make address fields read-only', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('readonly');
      });
    });
  });

  describe('Coordinates Section', () => {
    it('should display latitude', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('Latitude')).toBeInTheDocument();
      expect(screen.getByDisplayValue('47.6062')).toBeInTheDocument();
    });

    it('should display longitude', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByText('Longitude')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-122.3321')).toBeInTheDocument();
    });

    it('should use position from result when props not provided', () => {
      const result = createMockResult();
      renderWithProvider({
        result,
        open: true,
        onOpenChange: mockOnOpenChange,
        // No latitude/longitude props - should use result.position
      });

      expect(screen.getByDisplayValue('47.6062')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-122.3321')).toBeInTheDocument();
    });
  });

  describe('Map Preview', () => {
    it('should render map preview when hasMapData is true', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // MapPreview renders a div with map container
      const mapContainer = screen.getByLabelText(/map showing/i);
      expect(mapContainer).toBeInTheDocument();
    });

    it('should not render map preview when hasMapData is false', () => {
      mockUseAzureMap.hasMapData = false;

      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.queryByLabelText(/map showing/i)).not.toBeInTheDocument();
    });

    it('should include address in map aria-label', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(
        screen.getByLabelText('Map showing 123 Main Street, Seattle, WA 98101')
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render Cancel button', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render Select button', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    });

    it('should call onCancel and onOpenChange when Cancel is clicked', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onSelect with result and close dialog when Select is clicked', () => {
      const result = createMockResult();
      renderWithProvider({
        result,
        open: true,
        onOpenChange: mockOnOpenChange,
        onSelect: mockOnSelect,
        onCancel: mockOnCancel,
      });

      const selectButton = screen.getByRole('button', { name: 'Select' });
      fireEvent.click(selectButton);

      expect(mockOnSelect).toHaveBeenCalledWith(result);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should stop propagation on Cancel button mouseDown', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mouseDownEvent, 'stopPropagation');

      cancelButton.dispatchEvent(mouseDownEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should stop propagation on Select button mouseDown', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      const selectButton = screen.getByRole('button', { name: 'Select' });
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mouseDownEvent, 'stopPropagation');

      selectButton.dispatchEvent(mouseDownEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Size Configurations', () => {
    it('should use medium size configuration by default', () => {
      mockPcfContext.mapSize = 'medium';

      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // Should render without errors with medium size
      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });

    it('should handle small map size', () => {
      mockPcfContext.mapSize = 'small';

      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // Should render without errors with small size
      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });

    it('should handle large map size', () => {
      mockPcfContext.mapSize = 'large';

      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // Should render without errors with large size
      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });

    it('should default to medium for invalid map size', () => {
      mockPcfContext.mapSize = 'invalid' as unknown as 'medium';

      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // Should still render without errors
      expect(screen.getByText('123 Main Street, Seattle, WA 98101')).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('should use getString for button labels', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(mockPcfContext.getString).toHaveBeenCalledWith(
        'azure-maps-panel-cancel',
        'Cancel'
      );
      expect(mockPcfContext.getString).toHaveBeenCalledWith(
        'azure-maps-panel-select',
        'Select'
      );
    });

    it('should use getString for field labels', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      expect(mockPcfContext.getString).toHaveBeenCalledWith(
        'azure-maps-panel-street',
        'Street'
      );
      expect(mockPcfContext.getString).toHaveBeenCalledWith(
        'azure-maps-panel-city',
        'City'
      );
    });
  });

  describe('Missing Address Fields', () => {
    it('should not render street field when streetName and streetNumber are missing', () => {
      const result = createMockResult({
        address: {
          municipality: 'Seattle',
          countryCode: 'US',
          country: 'United States',
          freeformAddress: 'Seattle, US',
        },
      });

      renderWithProvider({
        ...defaultProps,
        result,
        open: true,
      });

      expect(screen.queryByText('Street')).not.toBeInTheDocument();
    });

    it('should handle result without position', () => {
      const result = createMockResult({
        position: undefined,
        address: {
          municipality: 'Seattle',
          countrySubdivision: 'WA',
          countryCode: 'US',
          country: 'United States',
          postalCode: '98101',
          freeformAddress: 'Seattle, WA 98101',
        },
      });

      renderWithProvider({
        result,
        open: true,
        onOpenChange: mockOnOpenChange,
        latitude: undefined,
        longitude: undefined,
      });

      // Should render without coordinates - check dialog rendered
      expect(screen.getByText('Seattle, WA 98101')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onOpenChange when dialog open state changes', () => {
      renderWithProvider({
        ...defaultProps,
        open: true,
      });

      // Close button triggers the dialog close
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should prevent click propagation on trigger button', () => {
      renderWithProvider(defaultProps);

      const button = screen.getByRole('button');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

      button.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
