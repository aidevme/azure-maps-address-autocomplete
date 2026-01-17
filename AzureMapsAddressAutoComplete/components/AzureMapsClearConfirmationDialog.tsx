// AzureMapsAddressAutoComplete\components\AzureMapsClearConfirmationDialog.tsx
import * as React from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
} from "@fluentui/react-components";
import type { PcfContextService } from "../services/PcfContext/PcfContextService";

/**
 * Props for the AzureMapsClearConfirmationDialog component.
 */
export interface IAzureMapsClearConfirmationDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Title text for the dialog. */
  title?: string;
  /** Message text to display in the dialog. */
  message?: string;
  /** Text for the OK button. */
  clearButtonText?: string;
  /** Text for the Cancel button. */
  cancelButtonText?: string;
  /** PCF context service for accessing platform context. */
  pcfContext?: PcfContextService;
  /** Callback when the user confirms (clicks OK). */
  onConfirm?: () => void;
  /** Callback when the user cancels or dismisses the dialog. */
  onCancel?: () => void;
}

/**
 * A confirmation dialog for clearing address fields.
 * Displays a message with OK and Cancel buttons.
 *
 * @param props - The component props.
 * @returns The rendered dialog component.
 *
 * @example
 * ```tsx
 * <AzureMapsClearConfirmationDialog
 *   open={showDialog}
 *   title="Clear Address"
 *   message="Are you sure you want to clear all address fields?"
 *   onConfirm={() => handleClear()}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export const AzureMapsClearConfirmationDialog: React.FC<
  IAzureMapsClearConfirmationDialogProps
> = ({
  open,
  title,
  message,
  clearButtonText,
  cancelButtonText,
  pcfContext,
  onConfirm,
  onCancel,
}) => {
  // Get localized title from resources or use provided title or default
  const dialogTitle =
    title ??
    pcfContext?.getString(
      "azure-maps-address-auto-complete-clear-dialog-title",
      "Clear Address Fields",
    ) ??
    "Clear Address Fields";

  // Get localized message from resources or use provided message or default
  const dialogMessage =
    message ??
    pcfContext?.getString(
      "azure-maps-address-auto-complete-clear-dialog-message",
      "Are you sure you want to clear all address fields? This action will remove all saved address information and cannot be undone.",
    ) ??
    "Are you sure you want to clear all address fields? This action will remove all saved address information and cannot be undone.";

  // Get localized Clear button text from resources or use provided text or default
  const clearLabel =
    clearButtonText ??
    pcfContext?.getString(
      "azure-maps-address-auto-complete-clear-dialog-clear-button-label",
      "Clear",
    ) ??
    "Clear";

  // Get localized Cancel button text from resources or use provided text or default
  const cancelLabel =
    cancelButtonText ??
    pcfContext?.getString(
      "azure-maps-address-auto-complete-clear-dialog-cancel-button-label",
      "Cancel",
    ) ??
    "Cancel";

  /**
   * Handles the OK button click.
   */
  const handleConfirm = React.useCallback(() => {
    onConfirm?.();
  }, [onConfirm]);

  /**
   * Handles the Cancel button click or dialog dismiss.
   */
  const handleCancel = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <Dialog
      open={open}
      modalType="alert"
      onOpenChange={(_, data) => {
        if (!data.open) {
          handleCancel();
        }
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>{dialogMessage}</DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleConfirm}>
              {clearLabel}
            </Button>
            <Button appearance="secondary" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
