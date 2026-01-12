/**
 * Type definitions and error classes for Dataverse API interactions.
 * @module types
 */

/**
 * Error source types for identifying the origin of errors.
 */
export type ErrorSource = "azure-maps" | "dataverse" | "unknown";

/**
 * Dataverse error detail structure.
 */
export interface DataverseErrorDetail {
  /** The error code. */
  code?: string;
  /** The error message. */
  message?: string;
}

/**
 * Custom error class for Dataverse API errors.
 * Provides structured error information including code, message, and HTTP status.
 *
 * @example
 * ```ts
 * try {
 *   const settings = await getUserSettings(userId);
 * } catch (error) {
 *   if (error instanceof DataverseApiError) {
 *     console.log(`Error ${error.code}: ${error.message}`);
 *     console.log(`HTTP Status: ${error.httpStatus}`);
 *   }
 * }
 * ```
 */
export class DataverseApiError extends Error {
  /** The Dataverse error code. */
  public readonly code: string;
  /** The HTTP status code. */
  public readonly httpStatus: number;
  /** The Dataverse-specific error code (numeric). */
  public readonly errorCode?: number;
  /** The entity name related to the error. */
  public readonly entityName?: string;
  /** Nested error details. */
  public readonly details?: DataverseErrorDetail[];

  /**
   * Creates a new DataverseApiError.
   *
   * @param message - The error message.
   * @param code - The Dataverse error code string.
   * @param httpStatus - The HTTP status code.
   * @param errorCode - Optional Dataverse-specific numeric error code.
   * @param entityName - Optional entity name related to the error.
   * @param details - Optional nested error details.
   */
  constructor(
    message: string,
    code: string,
    httpStatus: number,
    errorCode?: number,
    entityName?: string,
    details?: DataverseErrorDetail[]
  ) {
    super(message);
    this.name = "DataverseApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.entityName = entityName;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, DataverseApiError);
    }
  }

  /**
   * Returns a human-readable description of the error.
   *
   * @returns A formatted error string.
   */
  public toString(): string {
    let result = `DataverseApiError [${this.code}] (HTTP ${this.httpStatus}): ${this.message}`;
    if (this.errorCode) {
      result += ` (errorCode: ${this.errorCode})`;
    }
    if (this.entityName) {
      result += ` (entity: ${this.entityName})`;
    }
    return result;
  }
}

/**
 * Type guard to check if an error is a DataverseApiError.
 *
 * @param error - The error to check.
 * @returns True if the error is a DataverseApiError.
 */
export function isDataverseApiError(
  error: unknown
): error is DataverseApiError {
  return error instanceof DataverseApiError;
}

/**
 * Type guard to check if an error has DataverseApiError properties.
 * Useful for checking errors that may have been serialized/deserialized.
 *
 * @param error - The error to check.
 * @returns True if the error has DataverseApiError-like properties.
 */
export function hasDataverseErrorProperties(error: unknown): error is {
  code: string;
  httpStatus: number;
  message: string;
  errorCode?: number;
  entityName?: string;
  details?: DataverseErrorDetail[];
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "httpStatus" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    typeof (error as Record<string, unknown>).httpStatus === "number" &&
    (error as { name?: string }).name === "DataverseApiError"
  );
}
