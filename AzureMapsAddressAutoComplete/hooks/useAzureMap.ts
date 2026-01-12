/**
 * Custom hook for Azure Maps initialization and management.
 *
 * @remarks
 * This hook handles the complete lifecycle of an Azure Maps instance,
 * including SDK loading, map creation, marker placement, and cleanup.
 *
 * @packageDocumentation
 */

import * as React from 'react';
import { loadAzureMapsSdk, getAtlas } from '../utils/azureMapsSdkLoader';
// Import marker styles - bundled with the component
import '../styles/azureMapsMarker.css';

/**
 * Options for the useAzureMap hook.
 */
export interface UseAzureMapOptions {
  /** Whether the map should be initialized (e.g., dialog is open). */
  enabled: boolean;
  /** Latitude coordinate for map center. */
  latitude: number | undefined;
  /** Longitude coordinate for map center. */
  longitude: number | undefined;
  /** Azure Maps subscription key. */
  subscriptionKey: string;
}

/**
 * Return value from the useAzureMap hook.
 */
export interface UseAzureMapReturn {
  /** Ref to attach to the map container element. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the map is currently loading. */
  isLoading: boolean;
  /** Whether the map has valid data to display. */
  hasMapData: boolean;
}

/** HTML content for the map marker. */
const MARKER_HTML = "<div><div class='azure-maps-pin azure-maps-bounce'></div><div class='azure-maps-pulse'></div></div>";

/**
 * Custom hook for initializing and managing an Azure Maps instance.
 *
 * @param options - Configuration options for the map.
 * @returns Object containing container ref, loading state, and data availability.
 *
 * @remarks
 * This hook automatically handles:
 * - Lazy loading of the Azure Maps SDK
 * - Map instance creation and configuration
 * - Marker placement with animations
 * - Cleanup on unmount or when disabled
 *
 * @example
 * ```tsx
 * const { containerRef, isLoading, hasMapData } = useAzureMap({
 *   enabled: dialogOpen,
 *   latitude: 47.6062,
 *   longitude: -122.3321,
 *   subscriptionKey: 'your-key'
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: '300px' }}>
 *     {isLoading && <Spinner />}
 *   </div>
 * );
 * ```
 *
 * @public
 */
export function useAzureMap(options: UseAzureMapOptions): UseAzureMapReturn {
  const { enabled, latitude, longitude, subscriptionKey } = options;

  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = React.useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const hasMapData = latitude !== undefined && longitude !== undefined && !!subscriptionKey;

  React.useEffect(() => {
    if (!enabled || !hasMapData || !containerRef.current) {
      return;
    }

    let isMounted = true;

    const initMap = async () => {
      setIsLoading(true);
      await loadAzureMapsSdk();

      const atlasInstance = getAtlas();
      if (!isMounted || !containerRef.current || !atlasInstance) {
        return;
      }

      // Dispose existing map if any
      if (mapRef.current) {
        (mapRef.current as { dispose: () => void }).dispose();
        mapRef.current = null;
      }

      // Get constructors from atlas
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const MapConstructor = atlasInstance.Map as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const HtmlMarkerConstructor = atlasInstance.HtmlMarker as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const AuthenticationType = atlasInstance.AuthenticationType as any;

      // Create map instance
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const map = new MapConstructor(containerRef.current, {
        center: [longitude, latitude],
        zoom: 15,
        view: 'Auto',
        style: 'road',
        authOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          authType: AuthenticationType.subscriptionKey,
          subscriptionKey: subscriptionKey
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mapRef.current = map;

      // Wait for map to be ready
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      map.events.add('ready', () => {
        if (!isMounted) return;

        // Add marker at the location
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const marker = new HtmlMarkerConstructor({
          htmlContent: MARKER_HTML,
          position: [longitude, latitude],
          pixelOffset: [5, -18]
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        map.markers.add(marker);
        setIsLoading(false);
      });
    };

    void initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        (mapRef.current as { dispose: () => void }).dispose();
        mapRef.current = null;
      }
    };
  }, [enabled, hasMapData, latitude, longitude, subscriptionKey]);

  return {
    containerRef,
    isLoading,
    hasMapData
  };
}
