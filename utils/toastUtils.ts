/**
 * Alert Modal Utility Functions
 * Used to show alert modals, replacing alert and toast
 */

import { AlertType } from '../components/AlertModal';

// Global alert state management
interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

let globalAlertSetter: ((alert: AlertState | null) => void) | null = null;

/**
 * Set global alert setter
 */
export const setGlobalAlertSetter = (
  setter: (alert: AlertState | null) => void
) => {
  globalAlertSetter = setter;
};

/**
 * Show alert modal
 * @param message Message text
 * @param type Alert type: 'success' | 'error' | 'info' | 'warning'
 * @param title Title (optional)
 * @param onConfirm Confirm callback (optional)
 * @param showCancel Whether to show cancel button (optional)
 */
export const showAlert = (
  message: string,
  type: AlertType = 'info',
  title?: string,
  onConfirm?: () => void,
  showCancel: boolean = false
) => {
  if (globalAlertSetter) {
    globalAlertSetter({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
    });
  } else {
    // If global setter not set, fallback to alert (dev stage)
    console.warn('Alert setter not initialized, using alert fallback:', message);
    alert(message);
  }
};

/**
 * Show success alert
 */
export const showSuccess = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'success', title, onConfirm);
};

/**
 * Show error alert
 */
export const showError = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'error', title, onConfirm);
};

/**
 * Show warning alert
 */
export const showWarning = (
  message: string,
  title?: string,
  onConfirm?: () => void,
  showCancel: boolean = false
) => {
  showAlert(message, 'warning', title, onConfirm, showCancel);
};

/**
 * Show info alert
 */
export const showInfo = (
  message: string,
  title?: string,
  onConfirm?: () => void
) => {
  showAlert(message, 'info', title, onConfirm);
};

/**
 * Show confirm dialog
 */
export const showConfirm = (
  message: string,
  title: string = 'Confirm',
  onConfirm?: () => void,
  onCancel?: () => void
) => {
  if (globalAlertSetter) {
    globalAlertSetter({
      isOpen: true,
      type: 'warning',
      title,
      message,
      onConfirm,
      showCancel: true,
      onCancel,
    });
  } else {
    // Fallback to native confirm
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && onConfirm) {
      onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }
  }
};

