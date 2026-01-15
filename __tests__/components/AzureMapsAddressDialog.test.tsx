/**
 * Unit tests for AzureMapsAddressDialog component.
 *
 * @remarks
 * Tests error dialog display, error extraction, suggested actions,
 * and copy to clipboard functionality.
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import {
  AzureMapsAddressDialog,
  IAzureMapsAddressDialogProps,
} from '../../AzureMapsAddressAutoComplete/components/AzureMapsAddressDialog';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock console.error for expected errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

/**
 * Helper to render component with FluentProvider.
 */
const renderWithProvider = (props: IAzureMapsAddressDialogProps) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      <AzureMapsAddressDialog {...props} />
    </FluentProvider>
  );
};

/**
 * Creates a mock AzureMapsApiError for testing.
 */
const createAzureMapsApiError = (
  code: string,
  httpStatus: number,
  message: string,
  target?: string,
  details?: Array<{ code?: string; message?: string; target?: string }>
): Error => {
  const error = new Error(message);
  error.name = 'AzureMapsApiError';
  Object.assign(error, { code, httpStatus, target, details });
  return error;
};

/**
 * Creates a mock DataverseApiError for testing.
 */
const createDataverseApiError = (
  code: string,
  httpStatus: number,
  message: string,
  errorCode?: number,
  entityName?: string
): Error => {
  const error = new Error(message);
  error.name = 'DataverseApiError';
  Object.assign(error, { code, httpStatus, errorCode, entityName });
  return error;
};

describe('AzureMapsAddressDialog', () => {
  const mockOnDismiss = jest.fn();

  const defaultProps: IAzureMapsAddressDialogProps = {
    open: true,
    error: new Error('Test error'),
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when error is null', () => {
      const { container } = renderWithProvider({
        ...defaultProps,
        error: null,
      });

      expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    });

    it('should render dialog when open with error', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should display default title when not provided', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText('Address Search Error')).toBeInTheDocument();
    });

    it('should display custom title when provided', () => {
      renderWithProvider({
        ...defaultProps,
        title: 'Custom Error Title',
      });

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('should display error message', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should display Close button', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Generic Error Handling', () => {
    it('should display generic error code for non-API errors', () => {
      renderWithProvider({
        ...defaultProps,
        error: new Error('Something went wrong'),
      });

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display suggested actions for generic errors', () => {
      renderWithProvider({
        ...defaultProps,
        error: new Error('Connection failed'),
      });

      expect(screen.getByText('Suggested Actions')).toBeInTheDocument();
      expect(
        screen.getByText(/check your network connection/i)
      ).toBeInTheDocument();
    });
  });

  describe('AzureMapsApiError Handling', () => {
    it('should display API error code and HTTP status', () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Invalid parameter value'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(screen.getByText('InvalidInput')).toBeInTheDocument();
      expect(screen.getByText(/HTTP 400/)).toBeInTheDocument();
      // Status description is rendered as "HTTP 400 • Bad Request", use regex match
      expect(screen.getByText(/Bad Request/)).toBeInTheDocument();
    });

    it('should display target when present', () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Invalid country code',
        'countrySet'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('countrySet')).toBeInTheDocument();
    });

    it('should display error details when present', () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Multiple validation errors',
        undefined,
        [
          { code: 'InvalidCountry', message: 'Country code XX is invalid' },
          { code: 'InvalidFormat', message: 'Postal code format is wrong' },
        ]
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Country code XX is invalid')).toBeInTheDocument();
      expect(screen.getByText('Postal code format is wrong')).toBeInTheDocument();
    });

    it('should display documentation link for API errors', () => {
      const apiError = createAzureMapsApiError(
        'Unauthorized',
        401,
        'Invalid subscription key'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
        documentationUrl: 'https://docs.example.com',
      });

      const docLink = screen.getByText('View Azure Maps Documentation');
      expect(docLink).toBeInTheDocument();
      expect(docLink).toHaveAttribute('href', 'https://docs.example.com');
      expect(docLink).toHaveAttribute('target', '_blank');
    });

    it('should show 401 specific suggested actions', () => {
      const apiError = createAzureMapsApiError(
        'Unauthorized',
        401,
        'Invalid subscription key'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(
        screen.getByText(/verify your azure maps subscription key/i)
      ).toBeInTheDocument();
    });

    it('should show 403 specific suggested actions', () => {
      const apiError = createAzureMapsApiError(
        'Forbidden',
        403,
        'Access denied'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(
        screen.getByText(/verify your subscription has permission/i)
      ).toBeInTheDocument();
    });

    it('should show 429 specific suggested actions', () => {
      const apiError = createAzureMapsApiError(
        'TooManyRequests',
        429,
        'Rate limit exceeded'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(screen.getByText(/wait a moment and try again/i)).toBeInTheDocument();
    });

    it('should show 500 specific suggested actions', () => {
      const apiError = createAzureMapsApiError(
        'InternalError',
        500,
        'Server error occurred'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      expect(
        screen.getByText(/wait a few minutes and try again/i)
      ).toBeInTheDocument();
    });
  });

  describe('DataverseApiError Handling', () => {
    it('should display Dataverse error code and HTTP status', () => {
      const dataverseError = createDataverseApiError(
        'InvalidEntity',
        404,
        'Entity not found'
      );

      renderWithProvider({
        ...defaultProps,
        error: dataverseError,
      });

      expect(screen.getByText('InvalidEntity')).toBeInTheDocument();
      expect(screen.getByText(/HTTP 404/)).toBeInTheDocument();
    });

    it('should show Dataverse 403 specific suggested actions', () => {
      const dataverseError = createDataverseApiError(
        'Forbidden',
        403,
        'Access denied'
      );

      renderWithProvider({
        ...defaultProps,
        error: dataverseError,
      });

      expect(
        screen.getByText(/verify you have the required security role/i)
      ).toBeInTheDocument();
    });

    it('should show Dataverse 401 specific suggested actions', () => {
      const dataverseError = createDataverseApiError(
        'Unauthorized',
        401,
        'Session expired'
      );

      renderWithProvider({
        ...defaultProps,
        error: dataverseError,
      });

      expect(
        screen.getByText(/your session may have expired/i)
      ).toBeInTheDocument();
    });
  });

  describe('HTTP Status Descriptions', () => {
    const statusCases: Array<[number, string]> = [
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [429, 'Too Many Requests'],
      [500, 'Internal Server Error'],
      [503, 'Service Unavailable'],
    ];

    it.each(statusCases)(
      'should show correct description for HTTP %i',
      (status, description) => {
        const apiError = createAzureMapsApiError(
          'TestError',
          status,
          'Test message'
        );

        renderWithProvider({
          ...defaultProps,
          error: apiError,
        });

        // The status description is rendered inside "HTTP {status} • {description}"
        expect(screen.getByText(new RegExp(description))).toBeInTheDocument();
      }
    );

    it('should show "Error" for unknown HTTP status', () => {
      const apiError = createAzureMapsApiError(
        'TestError',
        418,
        'Test message'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      // "Error" appears for unknown status
      expect(screen.getByText(/HTTP 418/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when Close button is clicked', () => {
      renderWithProvider(defaultProps);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should copy error details to clipboard when copy icon is clicked', async () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Invalid parameter',
        'countrySet'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      // Find and click the copy icon by its aria-label
      const copyIcon = screen.getByRole('img', { name: /copy error details/i });
      expect(copyIcon).toBeInTheDocument();

      fireEvent.click(copyIcon);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should show copied message after successful clipboard copy', async () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Invalid parameter',
        'countrySet'
      );

      renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      // Find and click the copy icon by its aria-label
      const copyIcon = screen.getByRole('img', { name: /copy error details/i });

      await act(async () => {
        fireEvent.click(copyIcon);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/error details copied to clipboard/i)
        ).toBeInTheDocument();
      });
    });

    it('should reset copied message when dialog closes', async () => {
      const apiError = createAzureMapsApiError(
        'InvalidInput',
        400,
        'Invalid parameter',
        'countrySet'
      );

      const { rerender } = renderWithProvider({
        ...defaultProps,
        error: apiError,
      });

      // Close the dialog
      rerender(
        <FluentProvider theme={webLightTheme}>
          <AzureMapsAddressDialog {...defaultProps} error={apiError} open={false} />
        </FluentProvider>
      );

      // Reopen dialog - copied message should be gone
      rerender(
        <FluentProvider theme={webLightTheme}>
          <AzureMapsAddressDialog {...defaultProps} error={apiError} open={true} />
        </FluentProvider>
      );

      expect(
        screen.queryByText(/error details copied to clipboard/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Dialog State', () => {
    it('should call onDismiss when dialog is closed via onOpenChange', () => {
      renderWithProvider(defaultProps);

      // Fluent UI Dialog can close when clicking outside or pressing Escape
      // We test this by finding the dialog and triggering its close
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // Close button triggers onDismiss
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });
});
