import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarMock = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [NotificationService, { provide: MatSnackBar, useValue: snackBarMock }],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showError', () => {
    it('should open snackbar with default error configs and panelClass', () => {
      service.showError('Something failed');

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Something failed',
        'Dismiss',
        expect.objectContaining({
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snack-bar'],
        }),
      );
    });

    it('should allow custom action and merge additional panelClasses', () => {
      service.showError('Something failed', 'Retry', {
        duration: 8000,
        panelClass: ['custom-class'],
      });

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Something failed',
        'Retry',
        expect.objectContaining({
          duration: 8000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snack-bar', 'custom-class'],
        }),
      );
    });
  });

  describe('showSuccess', () => {
    it('should open snackbar with default success configs and panelClass', () => {
      service.showSuccess('Operation succeeded');

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Operation succeeded',
        'Dismiss',
        expect.objectContaining({
          duration: 2500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snack-bar'],
        }),
      );
    });
  });

  describe('showInfo', () => {
    it('should open snackbar with default info configs and panelClass', () => {
      service.showInfo('Info note');

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Info note',
        'Dismiss',
        expect.objectContaining({
          duration: 2500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['info-snack-bar'],
        }),
      );
    });
  });
});
