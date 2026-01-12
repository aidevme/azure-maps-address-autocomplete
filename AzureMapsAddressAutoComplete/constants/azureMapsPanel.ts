/**
 * Constants for the AzureMapsPanel component.
 * @module constants/azureMapsPanel
 */

/** Available map size options. */
export type MapSize = 'small' | 'medium' | 'large';

/** Configuration for a single map size. */
export interface MapSizeConfig {
  /** Width of the dialog. */
  dialogWidth: string;
  /** Minimum width of the dialog. */
  dialogMinWidth: string;
  /** Height of the map container. */
  mapHeight: string;
}

/** Map of size keys to their configuration. */
export type MapSizeConfigMap = Record<MapSize, MapSizeConfig>;

/**
 * Map size configurations for dialog and map dimensions.
 * Defines responsive sizing for small, medium, and large map views.
 */
export const MAP_SIZE_CONFIG: MapSizeConfigMap = {
  small: {
    dialogWidth: '320px',
    dialogMinWidth: '280px',
    mapHeight: '180px',
  },
  medium: {
    dialogWidth: '480px',
    dialogMinWidth: '400px',
    mapHeight: '280px',
  },
  large: {
    dialogWidth: '640px',
    dialogMinWidth: '560px',
    mapHeight: '400px',
  },
};

/** Field size options for address input fields. */
export type FieldSize = 'small' | 'medium';
