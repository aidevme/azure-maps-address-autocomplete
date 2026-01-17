import * as React from "react";
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";
import { IInputs } from "./generated/ManifestTypes";
import { PcfContextProvider } from "./services/PcfContext/PcfContext";
import { PcfContextService } from "./services/PcfContext/PcfContextService";

import {
  AzureMapsAddressAutoComplete,
  IAzureMapsAddressAutoCompleteProps,
} from "./components/AzureMapsAddressAutoComplete";
import { AzureMapsAddressDialog } from "./components/AzureMapsAddressDialog";

/**
 * Props for the AzureMapsAddressAutoCompleteApp component.
 */
export interface IAzureMapsAddressAutoCompleteAppProps
  extends IAzureMapsAddressAutoCompleteProps { 
  /** The PCF context object. */
  context: ComponentFramework.Context<IInputs>;
  /** Unique instance ID for the control. */
  instanceid: string;
}

/**
 * State for the AzureMapsAddressAutoCompleteApp component.
 */
interface IAzureMapsAddressAutoCompleteAppState {
  /** The initialization error, if any. */
  initError: Error | null;
  /** Whether the error dialog should be shown. */
  showErrorDialog: boolean;
  /** Whether initialization is complete. */
  isInitialized: boolean;
}

/**
 * Azure Maps Address AutoComplete App component.
 * Wraps the AzureMapsAddressAutoComplete component with FluentProvider.
 */
export class AzureMapsAddressAutoCompleteApp extends React.Component<
  IAzureMapsAddressAutoCompleteAppProps,
  IAzureMapsAddressAutoCompleteAppState
> {
  private pcfContextService: PcfContextService;

  constructor(props: IAzureMapsAddressAutoCompleteAppProps) {
    super(props);
    this.pcfContextService = new PcfContextService({
      context: props.context,
      instanceid: props.instanceid,
      onSelectedValueChange: (value) => {
        props.onSelect?.(value.address);
      },
    });
    
    this.state = {
      initError: null,
      showErrorDialog: false,
      isInitialized: false,
    };
  }

  /**
   * Initializes the PCF context service after the component mounts.
   */
  public componentDidMount(): void {
    void this.initializeAsync();
  }

  /**
   * Performs async initialization of the PCF context service.
   */
  private async initializeAsync(): Promise<void> {
    try {
      await this.pcfContextService.initialize();
      this.setState({ isInitialized: true });
    } catch (err) {
      console.error('AzureMapsAddressAutoCompleteApp: Initialization failed:', err);
      if (err instanceof Error) {
        this.setState({ 
          initError: err, 
          showErrorDialog: true,
          isInitialized: true, // Still mark as initialized to show the control
        });
      }
    }
  }

  /**
   * Handles dismissing the error dialog.
   */
  private handleErrorDismiss = (): void => {
    this.setState({ showErrorDialog: false, initError: null });
  };

  /**
   * Renders the component.
   * @returns The rendered React node.
   */
  public render(): React.ReactNode {
    // Return empty when control is not visible
    if (!this.pcfContextService.isVisible()) {
      return null;
    }

    const { instanceid, context: _context, ...autoCompleteProps } = this.props;
    const { initError, showErrorDialog } = this.state;

    // Get disabled state from pcfContextService
    const isDisabled = this.pcfContextService.disabled;

    // Use modified theme when disabled to show neutral colors
    const theme: Theme = isDisabled
      ? {
          ...webLightTheme,
          colorCompoundBrandStroke: webLightTheme.colorNeutralStroke1,
          colorCompoundBrandStrokeHover: webLightTheme.colorNeutralStroke1Hover,
          colorCompoundBrandStrokePressed: webLightTheme.colorNeutralStroke1Pressed,
        }
      : webLightTheme;

    return (
      <PcfContextProvider pcfcontext={this.pcfContextService}>
        <IdPrefixProvider value={`azure-maps-control-${instanceid}`}>
          <FluentProvider theme={theme}>
            <AzureMapsAddressAutoComplete
              {...autoCompleteProps}
              pcfContext={this.pcfContextService}
            />
            <AzureMapsAddressDialog
              open={showErrorDialog}
              error={initError}
              onDismiss={this.handleErrorDismiss}
              title="Initialization Error"
            />
          </FluentProvider>
        </IdPrefixProvider>
      </PcfContextProvider>
    );
  }
}
