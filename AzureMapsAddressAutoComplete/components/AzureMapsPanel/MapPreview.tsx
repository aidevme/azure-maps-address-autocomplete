/**
 * Map Preview Sub-component for AzureMapsPanel.
 *
 * @remarks
 * Displays an interactive map preview with loading state.
 *
 * @packageDocumentation
 */

import * as React from 'react';
import { Spinner } from '@fluentui/react-components';
import { useAzureMapsPanelStyles } from '../../styles';

/**
 * Props for the MapPreview component.
 */
export interface IMapPreviewProps {
  /** Ref to attach to the map container element. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the map is currently loading. */
  isLoading: boolean;
  /** Height of the map container. */
  height: string;
  /** Accessible label for the map. */
  ariaLabel: string;
}

/**
 * A sub-component that displays the map container with loading overlay.
 *
 * @param props - The component props.
 * @returns The rendered React element.
 *
 * @example
 * ```tsx
 * <MapPreview
 *   containerRef={mapContainerRef}
 *   isLoading={mapLoading}
 *   height="280px"
 *   ariaLabel="Map showing 123 Main St"
 * />
 * ```
 *
 * @internal
 */
export const MapPreview: React.FC<IMapPreviewProps> = (props) => {
  const { containerRef, isLoading, height, ariaLabel } = props;
  const styles = useAzureMapsPanelStyles();

  return (
    <div className={styles.mapContainer} style={{ height }}>
      {isLoading && (
        <div className={styles.mapLoading}>
          <Spinner size="small" label="Loading map..." />
        </div>
      )}
      <div
        ref={containerRef}
        className={styles.mapElement}
        aria-label={ariaLabel}
      />
    </div>
  );
};
