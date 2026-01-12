import * as React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Tooltip,
  MessageBar,
  MessageBarBody,
  tokens,
} from '@fluentui/react-components';
import { Icons } from '../utils/iconRegistry';
import { useAzureMapsAddressDialogStyles } from '../styles';
import type { ErrorSource } from '../types';

/**
 * Extracted API error information.
 */
interface ApiErrorInfo {
  /** The source of the error. */
  errorSource: ErrorSource;
  /** Whether the error is an AzureMapsApiError. */
  isApiError: boolean;
  /** Whether the error is a DataverseApiError. */
  isDataverseError: boolean;
  /** The error code. */
  code: string;
  /** The HTTP status code. */
  httpStatus: number | undefined;
  /** The error message. */
  message: string;
  /** The target of the error. */
  target: string | undefined;
  /** Nested error details. */
  details: ErrorDetailInfo[] | undefined;
  /** Dataverse-specific numeric error code. */
  errorCode: number | undefined;
  /** Entity name for Dataverse errors. */
  entityName: string | undefined;
}

/**
 * Extracted error detail information.
 */
interface ErrorDetailInfo {
  /** The error code. */
  code: string | undefined;
  /** The error message. */
  message: string | undefined;
  /** The target of the error. */
  target: string | undefined;
}

/**
 * Safely extracts properties from an error detail object.
 *
 * @param detail - The error detail to extract from.
 * @returns The extracted detail information.
 */
function extractDetailInfo(detail: unknown): ErrorDetailInfo {
  if (typeof detail === 'object' && detail !== null) {
    const obj = detail as Record<string, unknown>;
    return {
      code: typeof obj.code === 'string' ? obj.code : undefined,
      message: typeof obj.message === 'string' ? obj.message : undefined,
      target: typeof obj.target === 'string' ? obj.target : undefined,
    };
  }
  return { code: undefined, message: undefined, target: undefined };
}

/**
 * Type guard to check if an error has AzureMapsApiError properties.
 *
 * @param error - The error to check.
 * @returns True if the error has AzureMapsApiError properties.
 */
function hasApiErrorProperties(error: unknown): error is {
  code: string;
  httpStatus: number;
  message: string;
  target?: string;
  details?: unknown[];
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'httpStatus' in error &&
    typeof (error as Record<string, unknown>).code === 'string' &&
    typeof (error as Record<string, unknown>).httpStatus === 'number' &&
    (error as { name?: string }).name === 'AzureMapsApiError'
  );
}

/**
 * Type guard to check if an error has DataverseApiError properties.
 *
 * @param error - The error to check.
 * @returns True if the error has DataverseApiError properties.
 */
function hasDataverseErrorProperties(error: unknown): error is {
  code: string;
  httpStatus: number;
  message: string;
  errorCode?: number;
  entityName?: string;
  details?: unknown[];
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'httpStatus' in error &&
    typeof (error as Record<string, unknown>).code === 'string' &&
    typeof (error as Record<string, unknown>).httpStatus === 'number' &&
    (error as { name?: string }).name === 'DataverseApiError'
  );
}

/**
 * Safely extracts error information from an Error object.
 * Uses type guard pattern to handle AzureMapsApiError and DataverseApiError properties.
 *
 * @param error - The error to extract information from.
 * @returns The extracted error information.
 */
function extractErrorInfo(error: Error): ApiErrorInfo {
  // Check for Azure Maps API error
  if (hasApiErrorProperties(error)) {
    const details = Array.isArray(error.details)
      ? error.details.map(extractDetailInfo)
      : undefined;

    return {
      errorSource: 'azure-maps',
      isApiError: true,
      isDataverseError: false,
      code: error.code,
      httpStatus: error.httpStatus,
      message: error.message,
      target: typeof error.target === 'string' ? error.target : undefined,
      details,
      errorCode: undefined,
      entityName: undefined,
    };
  }

  // Check for Dataverse API error
  if (hasDataverseErrorProperties(error)) {
    const details = Array.isArray(error.details)
      ? error.details.map(extractDetailInfo)
      : undefined;

    return {
      errorSource: 'dataverse',
      isApiError: false,
      isDataverseError: true,
      code: error.code,
      httpStatus: error.httpStatus,
      message: error.message,
      target: undefined,
      details,
      errorCode: typeof error.errorCode === 'number' ? error.errorCode : undefined,
      entityName: typeof error.entityName === 'string' ? error.entityName : undefined,
    };
  }

  // Generic error
  return {
    errorSource: 'unknown',
    isApiError: false,
    isDataverseError: false,
    code: 'Error',
    httpStatus: undefined,
    message: error.message,
    target: undefined,
    details: undefined,
    errorCode: undefined,
    entityName: undefined,
  };
}

/**
 * Props for the AzureMapsAddressDialog component.
 */
export interface IAzureMapsAddressDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** The error to display. Can be an AzureMapsApiError or a generic Error. */
  error: Error | null;
  /** Callback when the dialog is dismissed. */
  onDismiss: () => void;
  /** Optional title for the dialog. Defaults to "Address Search Error". */
  title?: string;
  /** Optional documentation URL for the error. */
  documentationUrl?: string;
}

/**
 * Gets a user-friendly message based on HTTP status code.
 *
 * @param httpStatus - The HTTP status code.
 * @returns A user-friendly error description.
 */
function getStatusDescription(httpStatus: number): string {
  switch (httpStatus) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

/**
 * Gets suggested actions based on HTTP status code and error source.
 *
 * @param httpStatus - The HTTP status code.
 * @param errorSource - The source of the error.
 * @returns An array of suggested action strings.
 */
function getSuggestedActions(httpStatus: number | undefined, errorSource: ErrorSource): string[] {
  // Dataverse-specific suggested actions
  if (errorSource === 'dataverse') {
    if (!httpStatus) {
      return [
        'Check your network connection and try again',
        'Verify you have the required security role',
        'Contact your system administrator',
      ];
    }

    switch (httpStatus) {
      case 400:
        return [
          'Verify the request parameters are correct',
          'Check that the entity name and fields are valid',
          'Review the Dataverse API documentation',
        ];
      case 401:
        return [
          'Your session may have expired - try refreshing the page',
          'Verify you are logged in with a valid account',
          'Contact your administrator if the issue persists',
        ];
      case 403:
        return [
          'Verify you have the required security role for this operation',
          'Check with your administrator about your permissions',
          'Ensure the entity is not restricted by field-level security',
        ];
      case 404:
        return [
          'The requested record or entity was not found',
          'Verify the record still exists',
          'Check the entity name is correct',
        ];
      case 500:
      case 503:
        return [
          'Wait a few minutes and try again',
          'Check the Dataverse service health status',
          'Contact support if the issue persists',
        ];
      default:
        return [
          'Review the error details below',
          'Check the Dataverse API documentation',
          'Contact your system administrator for assistance',
        ];
    }
  }

  // Azure Maps specific suggested actions (default)
  if (!httpStatus) {
    return [
      'Check your network connection and try again',
      'Verify that all required parameters are provided',
    ];
  }

  switch (httpStatus) {
    case 400:
      return [
        'Verify all parameters follow the required format',
        'Check that country codes follow ISO 3166-1 alpha-2 standard',
        'Review Azure Maps API documentation for valid values',
      ];
    case 401:
      return [
        'Verify your Azure Maps subscription key is valid',
        'Check that the subscription key has not expired',
        'Ensure the subscription key is correctly configured',
      ];
    case 403:
      return [
        'Verify your subscription has permission for this operation',
        'Check your subscription tier supports the requested feature',
        'Contact your administrator to review access permissions',
      ];
    case 429:
      return [
        'Wait a moment and try again',
        'Consider implementing request throttling',
        'Review your subscription tier limits',
      ];
    case 500:
    case 503:
      return [
        'Wait a few minutes and try again',
        'Check Azure Maps service status',
        'Contact support if the issue persists',
      ];
    default:
      return [
        'Review the error details below',
        'Check Azure Maps API documentation',
        'Contact support if you need assistance',
      ];
  }
}

/**
 * Dialog component for displaying Azure Maps API errors with improved UX.
 * Provides a professional, user-friendly error presentation with actionable suggestions.
 *
 * @param props - The component props.
 * @returns The rendered React element.
 *
 * @example
 * ```tsx
 * <AzureMapsAddressDialog
 *   open={hasError}
 *   error={apiError}
 *   onDismiss={() => setHasError(false)}
 *   documentationUrl="https://docs.microsoft.com/azure/azure-maps/"
 * />
 * ```
 */
export const AzureMapsAddressDialog: React.FC<IAzureMapsAddressDialogProps> = (props) => {
  const { 
    open, 
    error, 
    onDismiss, 
    title = 'Address Search Error',
    documentationUrl = 'https://docs.microsoft.com/azure/azure-maps/',
  } = props;
  
  const styles = useAzureMapsAddressDialogStyles();
  const [showCopiedMessage, setShowCopiedMessage] = React.useState(false);

  // Reset copied message when dialog closes
  React.useEffect(() => {
    if (!open) {
      setShowCopiedMessage(false);
    }
  }, [open]);

  const handleCopyDetails = React.useCallback(() => {
    if (!error) return;

    const errorInfo = extractErrorInfo(error);
    const detailsText = `
Error Code: ${errorInfo.code}
HTTP Status: ${errorInfo.httpStatus ? `${errorInfo.httpStatus} - ${getStatusDescription(errorInfo.httpStatus)}` : 'N/A'}
Message: ${errorInfo.message}
${errorInfo.target ? `Target: ${errorInfo.target}` : ''}
${errorInfo.details && errorInfo.details.length > 0 ? `
Details:
${errorInfo.details.map(d => `  - ${d.code ? `[${d.code}] ` : ''}${d.message}${d.target ? ` (${d.target})` : ''}`).join('\n')}
` : ''}
    `.trim();

    navigator.clipboard.writeText(detailsText)
      .then(() => {
        setShowCopiedMessage(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowCopiedMessage(false), 3000);
        return undefined;
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  }, [error]);

  if (!error) {
    return null;
  }

  const errorInfo: ApiErrorInfo = extractErrorInfo(error);
  const errorCode = errorInfo.code;
  const httpStatus = errorInfo.httpStatus;
  const errorMessage = errorInfo.message;
  const target = errorInfo.target;
  const details = errorInfo.details;
  const isApiError = errorInfo.isApiError;
  const errorSource = errorInfo.errorSource;
  const suggestedActions = getSuggestedActions(httpStatus, errorSource);

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onDismiss()} modalType="alert">
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle>
          <span className={styles.titleContainer}>
            <Icons.ErrorCircle20Filled primaryFill={tokens.colorStatusDangerForeground1} />
            {title}
          </span>
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            {/* Copied to clipboard message */}
            {showCopiedMessage && (
              <MessageBar intent="success" style={{ marginBottom: '16px' }}>
                <MessageBarBody>
                  Error details copied to clipboard.<br />
                  You can paste this information into a support ticket or share it with your administrator for troubleshooting.
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Error Summary */}
            <div className={styles.errorSummary}>
              <div className={styles.errorCodeBadge}>{errorCode}</div>
              {httpStatus && (
                <Text className={styles.httpStatus}>
                  HTTP {httpStatus} • {getStatusDescription(httpStatus)}
                </Text>
              )}
              <Text className={styles.errorMessage}>
                {errorMessage}
              </Text>
              {isApiError && documentationUrl && (
                <a 
                  href={documentationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'block', 
                    marginTop: '12px', 
                    fontSize: tokens.fontSizeBase200,
                    color: tokens.colorBrandForeground1,
                  }}
                >
                  View Azure Maps Documentation
                </a>
              )}
            </div>

            {/* Technical Details Section */}
            {(target ?? (details && details.length > 0)) && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <Icons.Info16Regular className={styles.infoIcon} />
                  Technical Details
                  <Tooltip
                    content="Copy error details to clipboard (includes error code, HTTP status, message, and technical information for troubleshooting or support tickets)"
                    relationship="label"
                    positioning="above"
                    withArrow
                  >
                    <Icons.Copy16Regular 
                      className={styles.infoIcon} 
                      style={{ marginLeft: 'auto', cursor: 'pointer' }} 
                      onClick={handleCopyDetails}
                    />
                  </Tooltip>
                </div>
                <div className={styles.detailsList}>
                  {target && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Parameter</span>
                      {target}
                    </div>
                  )}
                  {details?.map((detail, index) => (
                    <div key={index} className={styles.detailItem}>
                      <span className={styles.detailLabel}>
                        {detail.code ?? 'Issue'}
                      </span>
                      {detail.message}
                      {detail.target && detail.target !== target && ` (${detail.target})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Suggested Actions
              </div>
              <div className={styles.troubleshooting}>
                {suggestedActions.map((action, index) => (
                  <div key={index} className={styles.troubleshootingItem}>
                    <span className={styles.bullet}>•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </DialogBody>
        <DialogActions>
        
          
           
              <Button appearance="primary" onClick={onDismiss}>
                Close
              </Button>
           
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
