/**
 * Icon Registry for Azure Maps Address AutoComplete component.
 *
 * @remarks
 * This module centralizes all Fluent UI icon imports used throughout the component.
 * Icons are imported individually to enable tree-shaking and reduce bundle size.
 *
 * @packageDocumentation
 */

import {
  Copy16Regular,
  DismissRegular,
  ErrorCircle20Filled,
  GlobeRegular,
  Info16Regular,
  LocationRegular,
  SearchRegular,
  ArrowUndoRegular
} from "@fluentui/react-icons";

/**
 * Centralized icon registry containing all Fluent UI icons used in the component.
 *
 * @remarks
 * Using a centralized registry allows for:
 * - Consistent icon usage across the application
 * - Easy icon swapping or theming
 * - Better tree-shaking with named imports
 *
 * @example
 * ```tsx
 * import { Icons } from "./utils/iconRegistry";
 *
 * const MyComponent = () => (
 *   <Icons.SearchRegular />
 * );
 * ```
 *
 * @public
 */
export const Icons = {
  /** Icon for copy/clipboard actions. */
  Copy16Regular: Copy16Regular,
  /** Icon for dismiss/close actions. */
  DismissRegular: DismissRegular,
  /** Icon for error states and validation failures. */
  ErrorCircle20Filled: ErrorCircle20Filled,
  /** Icon for global/region selection. */
  GlobeRegular: GlobeRegular,
  /** Icon for informational tooltips and hints. */
  Info16Regular: Info16Regular,
  /** Icon for location/address markers. */
  LocationRegular: LocationRegular,
  /** Icon for search input fields. */
  SearchRegular: SearchRegular,
  /** Icon for undo actions. */
  ArrowUndoRegular: ArrowUndoRegular,
} as const;
