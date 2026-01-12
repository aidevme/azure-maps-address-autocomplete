/**
 * PCF Property Helpers
 * Utility functions for safely extracting values from PCF context parameters.
 */

/**
 * Safely gets a string value from a PCF string property.
 * Handles error-typed values that can occur during PCF initialization.
 *
 * @param property - The PCF property (unknown type to handle error-typed values).
 * @param defaultValue - Default value if property is null/undefined.
 * @returns The string value or default.
 *
 * @example
 * ```ts
 * const value = getStringValue(context.parameters.myStringField);
 * const valueWithDefault = getStringValue(context.parameters.myStringField, 'default');
 * ```
 */
export function getStringValue(property: unknown, defaultValue = ''): string {
    if (property && typeof property === 'object' && 'raw' in property) {
        const raw = (property as { raw: string | null }).raw;
        return raw ?? defaultValue;
    }
    return defaultValue;
}

/**
 * Safely gets a number value from a PCF number property.
 * Handles error-typed values that can occur during PCF initialization.
 *
 * @param property - The PCF property (unknown type to handle error-typed values).
 * @returns The number value or undefined.
 *
 * @example
 * ```ts
 * const latitude = getNumberValue(context.parameters.latitude);
 * ```
 */
export function getNumberValue(property: unknown): number | undefined {
    if (property && typeof property === 'object' && 'raw' in property) {
        const raw = (property as { raw: number | null }).raw;
        return raw ?? undefined;
    }
    return undefined;
}

/**
 * Safely gets a boolean value from a PCF boolean property.
 * Handles error-typed values that can occur during PCF initialization.
 *
 * @param property - The PCF property (unknown type to handle error-typed values).
 * @param defaultValue - Default value if property is null/undefined.
 * @returns The boolean value or default.
 *
 * @example
 * ```ts
 * const isEnabled = getBooleanValue(context.parameters.isEnabled, false);
 * ```
 */
export function getBooleanValue(property: unknown, defaultValue = false): boolean {
    if (property && typeof property === 'object' && 'raw' in property) {
        const raw = (property as { raw: boolean | null }).raw;
        return raw ?? defaultValue;
    }
    return defaultValue;
}

/**
 * Map size type for the Azure Maps panel.
 */
export type MapSize = 'small' | 'medium' | 'large';

/**
 * Mapping from PCF enum values to MapSize strings.
 */
const MAP_SIZE_VALUES: Record<number, MapSize> = {
    0: 'small',
    1: 'medium',
    2: 'large',
};

/**
 * Safely gets a MapSize value from a PCF enum property.
 * Handles error-typed values that can occur during PCF initialization.
 *
 * @param property - The PCF property (unknown type to handle error-typed values).
 * @param defaultValue - Default value if property is null/undefined.
 * @returns The MapSize value or default.
 *
 * @example
 * ```ts
 * const mapSize = getMapSizeValue(context.parameters.mapSize, 'medium');
 * ```
 */
export function getMapSizeValue(property: unknown, defaultValue: MapSize = 'medium'): MapSize {
    if (property && typeof property === 'object' && 'raw' in property) {
        const raw = (property as { raw: number | null }).raw;
        if (raw !== null && raw !== undefined && raw in MAP_SIZE_VALUES) {
            return MAP_SIZE_VALUES[raw];
        }
    }
    return defaultValue;
}
