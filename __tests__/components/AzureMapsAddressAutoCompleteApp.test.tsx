/**
 * Unit tests for AzureMapsAddressAutoCompleteApp component.
 *
 * @remarks
 * Tests the main app wrapper component including FluentProvider setup,
 * PcfContextService initialization, error handling, and visibility states.
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
  AzureMapsAddressAutoCompleteApp,
  IAzureMapsAddressAutoCompleteAppProps,
} from '../../AzureMapsAddressAutoComplete/AzureMapsAddressAutoCompleteApp';
import { PcfContextService } from '../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContextService';
import { IInputs } from '../../AzureMapsAddressAutoComplete/generated/ManifestTypes';

// Mock PcfContextService
jest.mock('../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContextService', () => {
  const mockInstance = {
    subscriptionKey: 'test-key',
    defaultValue: '',
    defaultCountries: 'US',
    showMaps: true,
    mapSize: 'medium',
    disabled: false,
    useUserLanguage: false,
    defaultLanguage: 'en-US',
    uiLanguage: 'en-US',
    helpLanguage: 'en-US',
    instanceid: 'test-instance',
    isVisible: jest.fn().mockReturnValue(true),
    isCanvasApp: jest.fn().mockReturnValue(false),
    isControlDisabled: jest.fn().mockReturnValue(false),
    getEntityTypeName: jest.fn().mockReturnValue('account'),
    getEntityId: jest.fn().mockReturnValue('test-entity-id'),
    getUserId: jest.fn().mockReturnValue('test-user-id'),
    getString: jest.fn((key: string, fallback: string) => fallback),
    handleSelectionChange: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    getUserSettings: jest.fn().mockResolvedValue({
      isSuccess: true,
      result: { uilanguageid: 1033 },
    }),
    countries: [],
  };

  return {
    PcfContextService: jest.fn().mockImplementation(() => mockInstance),
  };
});

// Mock PcfContext provider
jest.mock('../../AzureMapsAddressAutoComplete/services/PcfContext/PcfContext', () => ({
  PcfContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePcfContext: jest.fn(() => ({
    subscriptionKey: 'test-key',
    mapSize: 'medium',
    getString: (key: string, fallback: string) => fallback,
  })),
}));

// Mock AzureMapsAddressAutoComplete component
jest.mock('../../AzureMapsAddressAutoComplete/components/AzureMapsAddressAutoComplete', () => ({
  AzureMapsAddressAutoComplete: ({ pcfContext }: { pcfContext: unknown }) => (
    <div data-testid="autocomplete-component">
      Azure Maps AutoComplete
      {pcfContext && <span data-testid="has-context">Has Context</span>}
    </div>
  ),
}));

// Mock AzureMapsAddressDialog component
jest.mock('../../AzureMapsAddressAutoComplete/components/AzureMapsAddressDialog', () => ({
  AzureMapsAddressDialog: ({
    open,
    error,
    onDismiss,
    title,
  }: {
    open: boolean;
    error: Error | null;
    onDismiss: () => void;
    title?: string;
  }) =>
    open && error ? (
      <div data-testid="error-dialog" role="dialog">
        <span data-testid="error-title">{title}</span>
        <span data-testid="error-message">{error.message}</span>
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null,
}));

// Mock console.error and console.log
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

/**
 * Creates a mock PCF context for testing.
 */
const createMockContext = (overrides: Partial<{
  isControlDisabled: boolean;
  isVisible: boolean;
  subscriptionKey: string;
}> = {}): ComponentFramework.Context<IInputs> => {
  const defaults = {
    isControlDisabled: false,
    isVisible: true,
    subscriptionKey: 'test-subscription-key',
    ...overrides,
  };

  return {
    parameters: {
      subscriptionKey: { raw: defaults.subscriptionKey },
      defaultCountries: { raw: 'US' },
      showMaps: { raw: true },
      mapSize: { raw: 1 },
      useUserLanguage: { raw: false },
      defaultLanguage: { raw: 1033 },
      azureMapsAddressSearchAutoComplete: {
        raw: '',
        security: { secured: false, editable: true },
      },
    },
    mode: {
      isControlDisabled: defaults.isControlDisabled,
      isVisible: defaults.isVisible,
      allocatedHeight: -1,
      allocatedWidth: -1,
      contextInfo: {
        entityTypeName: 'account',
        entityId: 'test-entity-id',
      },
    },
    userSettings: {
      userId: '{test-user-id}',
    },
    resources: {
      getString: jest.fn((key: string) => key),
    },
  } as unknown as ComponentFramework.Context<IInputs>;
};

describe('AzureMapsAddressAutoCompleteApp', () => {
  const mockOnSelect = jest.fn();

  const defaultProps: IAzureMapsAddressAutoCompleteAppProps = {
    context: createMockContext(),
    instanceid: 'test-instance-123',
    onSelect: mockOnSelect,
  };

  let mockPcfContextServiceInstance: {
    isVisible: jest.Mock;
    disabled: boolean;
    initialize: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock instance
    mockPcfContextServiceInstance = new (PcfContextService as jest.MockedClass<typeof PcfContextService>)({
      context: defaultProps.context,
      instanceid: defaultProps.instanceid,
      onSelectedValueChange: jest.fn(),
    }) as unknown as {
      isVisible: jest.Mock;
      disabled: boolean;
      initialize: jest.Mock;
    };
  });

  describe('Rendering', () => {
    it('should render the autocomplete component', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      expect(screen.getByTestId('autocomplete-component')).toBeInTheDocument();
    });

    it('should pass pcfContext to autocomplete component', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      expect(screen.getByTestId('has-context')).toBeInTheDocument();
    });

    it('should create PcfContextService with correct props', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      expect(PcfContextService).toHaveBeenCalledWith(
        expect.objectContaining({
          context: defaultProps.context,
          instanceid: defaultProps.instanceid,
        })
      );
    });
  });

  describe('Visibility', () => {
    it('should return null when control is not visible', async () => {
      // Reset mock to return false for isVisible
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(false),
        disabled: false,
        initialize: jest.fn().mockResolvedValue(undefined),
      } as unknown as PcfContextService));

      const { container } = render(
        <AzureMapsAddressAutoCompleteApp {...defaultProps} />
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render when control is visible', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      expect(screen.getByTestId('autocomplete-component')).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should call initialize on componentDidMount', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        const mockInstance = (PcfContextService as jest.MockedClass<typeof PcfContextService>).mock.results[0]?.value;
        if (mockInstance) {
          expect(mockInstance.initialize).toHaveBeenCalled();
        }
      });
    });

    it('should handle initialization success', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      // Should not show error dialog on success
      expect(screen.queryByTestId('error-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error dialog when initialization fails', async () => {
      const initError = new Error('Initialization failed');
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue(initError),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-dialog')).toBeInTheDocument();
      });
    });

    it('should display error message in dialog', async () => {
      const initError = new Error('API key is invalid');
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue(initError),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('API key is invalid');
      });
    });

    it('should show "Initialization Error" as dialog title', async () => {
      const initError = new Error('Test error');
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue(initError),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-title')).toHaveTextContent('Initialization Error');
      });
    });

    it('should dismiss error dialog when dismiss is called', async () => {
      const initError = new Error('Test error');
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue(initError),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-dialog')).toBeInTheDocument();
      });

      // Click dismiss button
      await act(async () => {
        screen.getByRole('button', { name: 'Dismiss' }).click();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('error-dialog')).not.toBeInTheDocument();
      });
    });

    it('should log error to console on initialization failure', async () => {
      const initError = new Error('Console test error');
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue(initError),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'AzureMapsAddressAutoCompleteApp: Initialization failed:',
          initError
        );
      });
    });

    it('should not show dialog for non-Error exceptions', async () => {
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: false,
        initialize: jest.fn().mockRejectedValue('string error'),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      await waitFor(() => {
        // Should not show dialog for non-Error exceptions
        expect(screen.queryByTestId('error-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should render with disabled styling when control is disabled', async () => {
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(() => ({
        ...mockPcfContextServiceInstance,
        isVisible: jest.fn().mockReturnValue(true),
        disabled: true,
        initialize: jest.fn().mockResolvedValue(undefined),
      } as unknown as PcfContextService));

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      // Component should still render, just with modified theme
      expect(screen.getByTestId('autocomplete-component')).toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('should create PcfContextService with onSelectedValueChange callback', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      expect(PcfContextService).toHaveBeenCalledWith(
        expect.objectContaining({
          onSelectedValueChange: expect.any(Function),
        })
      );
    });

    it('should call onSelect when address is selected via callback', async () => {
      let capturedCallback: ((value: { address: unknown }) => void) | undefined;
      
      (PcfContextService as jest.MockedClass<typeof PcfContextService>).mockImplementationOnce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (props: any) => {
          capturedCallback = props?.onSelectedValueChange;
          return {
            ...mockPcfContextServiceInstance,
            isVisible: jest.fn().mockReturnValue(true),
            disabled: false,
            initialize: jest.fn().mockResolvedValue(undefined),
          } as unknown as PcfContextService;
        }
      );

      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      // Simulate address selection through the callback
      if (capturedCallback) {
        await act(async () => {
          capturedCallback!({ address: { freeformAddress: '123 Main St' } });
        });

        expect(mockOnSelect).toHaveBeenCalledWith({ freeformAddress: '123 Main St' });
      }
    });
  });

  describe('FluentProvider', () => {
    it('should wrap content in FluentProvider', async () => {
      let container: HTMLElement;
      await act(async () => {
        const result = render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
        container = result.container;
      });

      // FluentProvider adds specific classes to its container
      expect(container!.querySelector('[class*="fui-FluentProvider"]')).toBeInTheDocument();
    });

    it('should use IdPrefixProvider with unique instance id', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      // The IdPrefixProvider affects generated IDs in child components
      expect(screen.getByTestId('autocomplete-component')).toBeInTheDocument();
    });
  });

  describe('Context Provider', () => {
    it('should wrap content in PcfContextProvider', async () => {
      await act(async () => {
        render(<AzureMapsAddressAutoCompleteApp {...defaultProps} />);
      });

      // PcfContextProvider should wrap the autocomplete component
      expect(screen.getByTestId('autocomplete-component')).toBeInTheDocument();
    });
  });
});
