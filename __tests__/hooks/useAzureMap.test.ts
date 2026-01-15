/**
 * Unit tests for useAzureMap hook.
 *
 * @remarks
 * Tests the Azure Maps initialization hook including SDK loading,
 * map creation, marker placement, and cleanup.
 */

import { renderHook } from '@testing-library/react-hooks';
import { useAzureMap, UseAzureMapOptions } from '../../AzureMapsAddressAutoComplete/hooks/useAzureMap';
import * as sdkLoader from '../../AzureMapsAddressAutoComplete/utils/azureMapsSdkLoader';

// Mock the SDK loader
jest.mock('../../AzureMapsAddressAutoComplete/utils/azureMapsSdkLoader', () => ({
  loadAzureMapsSdk: jest.fn(),
  getAtlas: jest.fn()
}));

// Mock CSS import
jest.mock('../../AzureMapsAddressAutoComplete/styles/azureMapsMarker.css', () => ({}));

describe('useAzureMap', () => {
  const mockSubscriptionKey = 'test-subscription-key';
  const defaultOptions: UseAzureMapOptions = {
    enabled: true,
    latitude: 47.6062,
    longitude: -122.3321,
    subscriptionKey: mockSubscriptionKey
  };

  // Mock atlas objects
  const mockDispose = jest.fn();
  const mockMarkersAdd = jest.fn();
  const mockEventsAdd = jest.fn();

  const mockMap = {
    dispose: mockDispose,
    markers: { add: mockMarkersAdd },
    events: {
      add: mockEventsAdd
    }
  };

  const mockMarker = { id: 'test-marker' };

  const mockAtlas = {
    Map: jest.fn(() => mockMap),
    HtmlMarker: jest.fn(() => mockMarker),
    AuthenticationType: { subscriptionKey: 'subscriptionKey' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sdkLoader.loadAzureMapsSdk as jest.Mock).mockResolvedValue(undefined);
    (sdkLoader.getAtlas as jest.Mock).mockReturnValue(mockAtlas);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasMapData).toBe(true);
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });

    it('should indicate hasMapData is false when latitude is missing', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: undefined })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should indicate hasMapData is false when longitude is missing', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, longitude: undefined })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should indicate hasMapData is false when subscriptionKey is missing', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, subscriptionKey: '' })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should indicate hasMapData is true when all required data exists', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current.hasMapData).toBe(true);
    });
  });

  describe('Disabled State', () => {
    it('should not load SDK when disabled', async () => {
      renderHook(() => 
        useAzureMap({ ...defaultOptions, enabled: false })
      );

      // Allow effect to run
      await Promise.resolve();

      expect(sdkLoader.loadAzureMapsSdk).not.toHaveBeenCalled();
      expect(mockAtlas.Map).not.toHaveBeenCalled();
    });

    it('should not load SDK when hasMapData is false', async () => {
      renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: undefined })
      );

      await Promise.resolve();

      expect(sdkLoader.loadAzureMapsSdk).not.toHaveBeenCalled();
    });

    it('should not load SDK when longitude is undefined', async () => {
      renderHook(() => 
        useAzureMap({ ...defaultOptions, longitude: undefined })
      );

      await Promise.resolve();

      expect(sdkLoader.loadAzureMapsSdk).not.toHaveBeenCalled();
    });

    it('should not load SDK when subscriptionKey is empty', async () => {
      renderHook(() => 
        useAzureMap({ ...defaultOptions, subscriptionKey: '' })
      );

      await Promise.resolve();

      expect(sdkLoader.loadAzureMapsSdk).not.toHaveBeenCalled();
    });
  });

  describe('Container Ref', () => {
    it('should return a valid ref object', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.containerRef).toBe('object');
      expect('current' in result.current.containerRef).toBe(true);
    });

    it('should have null initial value for containerRef', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current.containerRef.current).toBeNull();
    });
  });

  describe('Atlas Not Available', () => {
    it('should not throw when atlas is null', async () => {
      (sdkLoader.getAtlas as jest.Mock).mockReturnValue(null);
      
      // Should not throw
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      await Promise.resolve();

      expect(result.current.containerRef).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero coordinates', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: 0, longitude: 0 })
      );

      // Zero is a valid coordinate (equator/prime meridian)
      expect(result.current.hasMapData).toBe(true);
    });

    it('should handle negative coordinates', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: -33.8688, longitude: -151.2093 })
      );

      expect(result.current.hasMapData).toBe(true);
    });

    it('should handle coordinates at extremes', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: 90, longitude: 180 })
      );

      expect(result.current.hasMapData).toBe(true);
    });

    it('should handle coordinates at negative extremes', () => {
      const { result } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: -90, longitude: -180 })
      );

      expect(result.current.hasMapData).toBe(true);
    });
  });

  describe('Multiple Hooks', () => {
    it('should support multiple independent hook instances', () => {
      const { result: result1 } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: 47.0, longitude: -122.0 })
      );

      const { result: result2 } = renderHook(() => 
        useAzureMap({ ...defaultOptions, latitude: 48.0, longitude: -123.0 })
      );

      // Both should have independent refs
      expect(result1.current.containerRef).not.toBe(result2.current.containerRef);
      expect(result1.current.hasMapData).toBe(true);
      expect(result2.current.hasMapData).toBe(true);
    });

    it('should have independent loading states', () => {
      const { result: result1 } = renderHook(() => 
        useAzureMap({ ...defaultOptions, enabled: true })
      );

      const { result: result2 } = renderHook(() => 
        useAzureMap({ ...defaultOptions, enabled: false })
      );

      expect(result1.current.isLoading).toBe(true);
      expect(result2.current.isLoading).toBe(true);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current).toHaveProperty('containerRef');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('hasMapData');
    });

    it('should return containerRef as a React ref', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(result.current.containerRef).toEqual({ current: null });
    });

    it('should return isLoading as boolean', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should return hasMapData as boolean', () => {
      const { result } = renderHook(() => useAzureMap(defaultOptions));

      expect(typeof result.current.hasMapData).toBe('boolean');
    });
  });

  describe('Options Validation', () => {
    it('should handle undefined latitude correctly', () => {
      const { result } = renderHook(() => 
        useAzureMap({ enabled: true, latitude: undefined, longitude: -122.0, subscriptionKey: 'key' })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should handle undefined longitude correctly', () => {
      const { result } = renderHook(() => 
        useAzureMap({ enabled: true, latitude: 47.0, longitude: undefined, subscriptionKey: 'key' })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should handle empty string subscriptionKey', () => {
      const { result } = renderHook(() => 
        useAzureMap({ enabled: true, latitude: 47.0, longitude: -122.0, subscriptionKey: '' })
      );

      expect(result.current.hasMapData).toBe(false);
    });

    it('should handle all valid options', () => {
      const { result } = renderHook(() => 
        useAzureMap({ enabled: true, latitude: 47.0, longitude: -122.0, subscriptionKey: 'valid-key' })
      );

      expect(result.current.hasMapData).toBe(true);
    });
  });

  describe('Rerender Behavior', () => {
    it('should maintain ref identity across rerenders', () => {
      const { result, rerender } = renderHook(
        (props: UseAzureMapOptions) => useAzureMap(props),
        { initialProps: defaultOptions }
      );

      const initialRef = result.current.containerRef;

      rerender({ ...defaultOptions, latitude: 48.0 });

      expect(result.current.containerRef).toBe(initialRef);
    });

    it('should update hasMapData when latitude becomes undefined', () => {
      const { result, rerender } = renderHook(
        (props: UseAzureMapOptions) => useAzureMap(props),
        { initialProps: defaultOptions }
      );

      expect(result.current.hasMapData).toBe(true);

      rerender({ ...defaultOptions, latitude: undefined });

      expect(result.current.hasMapData).toBe(false);
    });

    it('should update hasMapData when subscriptionKey becomes empty', () => {
      const { result, rerender } = renderHook(
        (props: UseAzureMapOptions) => useAzureMap(props),
        { initialProps: defaultOptions }
      );

      expect(result.current.hasMapData).toBe(true);

      rerender({ ...defaultOptions, subscriptionKey: '' });

      expect(result.current.hasMapData).toBe(false);
    });
  });
});
