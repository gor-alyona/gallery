import { inject, Service } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

@Service()
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Displays an error notification with high-priority danger styling and panelClass.
   */
  showError(
    message: string,
    action = 'Dismiss',
    config?: MatSnackBarConfig,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...config,
      panelClass: this.combinePanelClasses('error-snack-bar', config?.panelClass),
    });
  }

  /**
   * Displays a success notification with positive green accent styling and panelClass.
   */
  showSuccess(
    message: string,
    action = 'Dismiss',
    config?: MatSnackBarConfig,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...config,
      panelClass: this.combinePanelClasses('success-snack-bar', config?.panelClass),
    });
  }

  /**
   * Displays an informational notification with standard styling and panelClass.
   */
  showInfo(
    message: string,
    action = 'Dismiss',
    config?: MatSnackBarConfig,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...config,
      panelClass: this.combinePanelClasses('info-snack-bar', config?.panelClass),
    });
  }

  private combinePanelClasses(baseClass: string, additionalClasses?: string | string[]): string[] {
    if (!additionalClasses) {
      return [baseClass];
    }
    const additional = Array.isArray(additionalClasses) ? additionalClasses : [additionalClasses];
    return [baseClass, ...additional];
  }
}
