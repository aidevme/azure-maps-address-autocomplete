/**
 * Azure Maps SDK Loader Utility.
 *
 * @remarks
 * This module provides utilities for dynamically loading the Azure Maps SDK.
 * It handles lazy loading of both CSS and JavaScript resources, with support
 * for multiple concurrent load requests through a callback queue.
 *
 * @packageDocumentation
 */

/** Azure Maps SDK CDN URL for CSS styles. */
const AZURE_MAPS_CSS_URL = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';

/** Azure Maps SDK CDN URL for JavaScript. */
const AZURE_MAPS_JS_URL = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js';

/** Track if SDK is loaded globally. */
let sdkLoaded = false;

/** Track if SDK is currently loading. */
let sdkLoading = false;

/** Queue of callbacks waiting for SDK to load. */
const sdkCallbacks: (() => void)[] = [];

/**
 * Dynamically loads the Azure Maps SDK.
 *
 * @remarks
 * This function handles lazy loading of the Azure Maps SDK from CDN.
 * Multiple calls will be batched - only one load operation occurs,
 * and all callers are notified when complete.
 *
 * @returns Promise that resolves when SDK is loaded.
 *
 * @example
 * ```ts
 * await loadAzureMapsSdk();
 * const atlas = getAtlas();
 * // Now atlas is available for use
 * ```
 *
 * @public
 */
export function loadAzureMapsSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (sdkLoaded) {
      resolve();
      return;
    }

    sdkCallbacks.push(resolve);

    if (sdkLoading) {
      return;
    }

    sdkLoading = true;

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = AZURE_MAPS_CSS_URL;
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = AZURE_MAPS_JS_URL;
    script.onload = () => {
      sdkLoaded = true;
      sdkLoading = false;
      sdkCallbacks.forEach(cb => cb());
      sdkCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

/**
 * Gets the atlas global object from globalThis.
 *
 * @remarks
 * This is used because the Azure Maps SDK is loaded dynamically
 * and attaches itself to the global scope.
 *
 * @returns The atlas object or undefined if not loaded.
 *
 * @example
 * ```ts
 * const atlas = getAtlas();
 * if (atlas) {
 *   const map = new atlas.Map(container, options);
 * }
 * ```
 *
 * @public
 */
export function getAtlas(): Record<string, unknown> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  return (globalThis as any).atlas as Record<string, unknown> | undefined;
}

/**
 * Checks if the Azure Maps SDK is currently loaded.
 *
 * @returns True if SDK is loaded, false otherwise.
 *
 * @public
 */
export function isAzureMapsSdkLoaded(): boolean {
  return sdkLoaded;
}
