import * as React from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Card,
  Tooltip,
  tokens
} from '@fluentui/react-components';
import { Icons } from '../utils/iconRegistry';
import { useAzureMap } from '../hooks/useAzureMap';
import { useAzureMapsPanelStyles, useAzureMapsAddressAutoCompleteStyles } from '../styles';
import { usePcfContext } from '../services/PcfContext/PcfContext';
import { MapPreview, AddressFields, CoordinatesSection } from './AzureMapsPanel/index';
import type { AzureMapsSearchResult } from '../services';

/** Available map size options. */
type MapSize = 'small' | 'medium' | 'large';

/** Field size options for address input fields. */
type FieldSize = 'small' | 'medium';

/** Configuration for a single map size. */
interface MapSizeConfig {
  dialogWidth: string;
  dialogMinWidth: string;
  mapHeight: string;
}

/**
 * Props for the AzureMapsPanel component.
 */
export interface IAzureMapsPanelProps {
  /** The search result to display details for. */
  result: AzureMapsSearchResult;
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback when the dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Callback when the Select button is clicked. */
  onSelect?: (result: AzureMapsSearchResult) => void;
  /** Callback when the Cancel button is clicked. */
  onCancel?: () => void;
  /** The latitude coordinate of the address. */
  latitude?: number;
  /** The longitude coordinate of the address. */
  longitude?: number;
}

/**
 * A panel component that displays detailed address information in a non-modal dialog.
 * Includes an interactive map preview when coordinates and subscription key are available.
 *
 * @param props - The component props.
 * @returns The rendered React element.
 */
/** Valid map size values for type guard validation. */
const VALID_MAP_SIZES: readonly MapSize[] = ['small', 'medium', 'large'];

/**
 * Type guard to check if a value is a valid MapSize.
 * @param value - The value to check.
 * @returns True if the value is a valid MapSize.
 */
const isValidMapSize = (value: unknown): value is MapSize =>
  typeof value === 'string' && VALID_MAP_SIZES.includes(value as MapSize);

/**
 * Gets the map size configuration for a given size.
 * @param size - The map size key.
 * @returns The configuration for the specified size.
 */
const getMapSizeConfig = (size: MapSize): MapSizeConfig => {
  switch (size) {
    case 'small':
      return {
        dialogWidth: '320px',
        dialogMinWidth: '280px',
        mapHeight: '180px',
      };
    case 'large':
      return {
        dialogWidth: '640px',
        dialogMinWidth: '560px',
        mapHeight: '400px',
      };
    case 'medium':
    default:
      return {
        dialogWidth: '480px',
        dialogMinWidth: '400px',
        mapHeight: '280px',
      };
  }
};

export const AzureMapsPanel: React.FC<IAzureMapsPanelProps> = (props) => {
  const { result, open, onOpenChange, onSelect, onCancel, latitude, longitude } = props;
  const styles = useAzureMapsPanelStyles();
  const commonStyles = useAzureMapsAddressAutoCompleteStyles();
  const pcfContext = usePcfContext();

  // Get values directly from pcfContext with type-safe validation
  const mapSize: MapSize = isValidMapSize(pcfContext?.mapSize) ? pcfContext.mapSize : 'medium';
  const subscriptionKey = pcfContext?.subscriptionKey ?? '';

  // Memoize size configuration based on mapSize
  const sizeConfig = React.useMemo<MapSizeConfig>(
    () => getMapSizeConfig(mapSize),
    [mapSize]
  );

  // Memoize field size (large maps use medium fields)
  const fieldSize = React.useMemo<FieldSize>(
    () => (mapSize === 'large' ? 'medium' : mapSize),
    [mapSize]
  );

  const lat = latitude ?? result.position?.lat;
  const lon = longitude ?? result.position?.lon;

  // Use custom hook for map initialization
  const { containerRef: mapContainerRef, isLoading: mapLoading, hasMapData } = useAzureMap({
    enabled: open,
    latitude: lat,
    longitude: lon,
    subscriptionKey
  });

  // Helper function for localized strings
  const getString = React.useCallback(
    (key: string, fallback: string) => pcfContext?.getString(key, fallback) ?? fallback,
    [pcfContext]
  );

  // Memoize event handlers
  const handleCancel = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const handleSelect = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(result);
    onOpenChange(false);
  }, [onSelect, result, onOpenChange]);

  const handleOpenChange = React.useCallback(
    (_e: unknown, data: { open: boolean }) => onOpenChange(data.open),
    [onOpenChange]
  );

  // Memoize aria label for map
  const mapAriaLabel = React.useMemo(
    () => `Map showing ${result.address.freeformAddress}`,
    [result.address.freeformAddress]
  );

  return (
    <Dialog
      modalType="non-modal"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Tooltip
        content={getString('mapPanelShowDetails_Key', 'Show address details')}
        relationship="label"
        withArrow
      >
        <span>
          <DialogTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              className={commonStyles.globeButton}
              icon={<Icons.GlobeRegular />}
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              aria-label={getString('mapPanelShowDetails_Key', 'Show address details')}
            />
          </DialogTrigger>
        </span>
      </Tooltip>
      <DialogSurface 
        className={styles.surface}
        style={{ 
          maxWidth: sizeConfig.dialogWidth, 
          minWidth: sizeConfig.dialogMinWidth
        }}
      >
        <DialogBody>
          <DialogTitle>
            <span className={styles.titleContainer}>
              <Icons.LocationRegular className={styles.titleIcon} />
              <span className={styles.titleText}>
                {result.address.freeformAddress}
              </span>
            </span>
          </DialogTitle>
          <DialogContent className={styles.content}>
            {hasMapData && (
              <MapPreview
                containerRef={mapContainerRef}
                isLoading={mapLoading}
                height={sizeConfig.mapHeight}
                ariaLabel={mapAriaLabel}
              />
            )}
            <Card style={{ padding: '12px', boxShadow: tokens.shadow8 }}>
              <AddressFields
                address={result.address}
                fieldSize={fieldSize}
                getString={getString}
              />
              <CoordinatesSection
                latitude={lat}
                longitude={lon}
                fieldSize={fieldSize}
                getString={getString}
              />
            </Card>
          </DialogContent>
          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={handleCancel}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {getString('azure-maps-panel-cancel', 'Cancel')}
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleSelect}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {getString('azure-maps-panel-select', 'Select')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
