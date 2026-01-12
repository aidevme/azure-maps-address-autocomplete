/**
 * Coordinates Section Sub-component for AzureMapsPanel.
 *
 * @remarks
 * Displays geographic coordinates (latitude/longitude) with a divider.
 *
 * @packageDocumentation
 */

import * as React from 'react';
import { Field, Input, Divider } from '@fluentui/react-components';

/**
 * Props for the CoordinatesSection component.
 */
export interface ICoordinatesSectionProps {
  /** Latitude coordinate. */
  latitude: number | undefined;
  /** Longitude coordinate. */
  longitude: number | undefined;
  /** Size of the fields ('small' | 'medium'). */
  fieldSize: 'small' | 'medium';
  /** Function to get localized strings. */
  getString: (key: string, fallback: string) => string;
}

/**
 * A sub-component that displays geographic coordinates with a divider.
 *
 * @param props - The component props.
 * @returns The rendered React element or null if no coordinates.
 *
 * @example
 * ```tsx
 * <CoordinatesSection
 *   latitude={47.6062}
 *   longitude={-122.3321}
 *   fieldSize="medium"
 *   getString={(key, fallback) => pcfContext?.getString(key, fallback) ?? fallback}
 * />
 * ```
 *
 * @internal
 */
export const CoordinatesSection: React.FC<ICoordinatesSectionProps> = (props) => {
  const { latitude, longitude, fieldSize, getString } = props;

  const hasCoordinates = longitude !== undefined || latitude !== undefined;

  if (!hasCoordinates) {
    return null;
  }

  return (
    <>
      <Divider style={{ margin: '12px 0' }}>
        {getString('azure-maps-panel-geographicCoordinates', 'Geographic Coordinates')}
      </Divider>
      {longitude !== undefined && (
        <Field
          label={getString('azure-maps-panel-longitude', 'Longitude')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={String(longitude)}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
      {latitude !== undefined && (
        <Field
          label={getString('azure-maps-panel-latitude', 'Latitude')}
          size={fieldSize}
          orientation="horizontal"
        >
          <Input
            value={String(latitude)}
            readOnly
            size={fieldSize}
            appearance="filled-darker"
          />
        </Field>
      )}
    </>
  );
};
