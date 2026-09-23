import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { PhotoDetailComponent } from './photo-detail.component';
import { PhotoService } from '../../core/services/photo.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { NotificationService } from '../../core/services/notification.service';
import { Photo } from '../../core/models/photo.model';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';
import { NotFoundComponent } from '../../core/components/not-found/not-found.component';
import { LoadingComponent } from '../../core/components/loading/loading.component';
import { PhotoCardComponent } from '../../core/components/photo-card/photo-card.component';

describe('PhotoDetailComponent', () => {
  let component: PhotoDetailComponent;
  let fixture: ComponentFixture<PhotoDetailComponent>;
  let photoServiceMock: {
    getPhotoById: ReturnType<typeof vi.fn>;
    mapIdToPhoto: ReturnType<typeof vi.fn>;
  };
  let favoritesServiceMock: { removeFavorite: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showSuccess: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockPhoto: Photo = {
    id: '42',
    url: 'https://picsum.photos/id/42/800/600',
  };

  beforeEach(async () => {
    photoServiceMock = {
      getPhotoById: vi.fn(),
      mapIdToPhoto: vi.fn(),
    };
    favoritesServiceMock = {
      removeFavorite: vi.fn().mockReturnValue(of(undefined)),
    };
    notificationServiceMock = {
      showSuccess: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PhotoDetailComponent],
      providers: [
        provideRouter([]),
        { provide: PhotoService, useValue: photoServiceMock },
        { provide: FavoritesService, useValue: favoritesServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    })
      .overrideComponent(PhotoDetailComponent, {
        set: {
          providers: [{ provide: NotificationService, useValue: notificationServiceMock }],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(PhotoDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '42');
  });

  it('should create and load photo details on init', () => {
    photoServiceMock.getPhotoById.mockReturnValue(of(mockPhoto));
    fixture.detectChanges();

    expect(photoServiceMock.getPhotoById).toHaveBeenCalledWith('42');
    expect(component['photo']()).toEqual(mockPhoto);
    expect(component['isLoading']()).toBe(false);

    const containerEl = fixture.debugElement.query(By.css('.photo-detail__container'));
    const photoCardEl = fixture.debugElement.query(By.directive(PhotoCardComponent));
    const removeBtnEl = fixture.debugElement.query(By.css('.photo-detail__remove-btn'));

    expect(containerEl).toBeTruthy();
    expect(photoCardEl).toBeTruthy();
    expect(photoCardEl.componentInstance.photo()).toEqual(mockPhoto);
    expect(removeBtnEl).toBeTruthy();
  });

  it('should remove photo from favorites, show snackbar notification, and navigate to /favorites when button is clicked', () => {
    photoServiceMock.getPhotoById.mockReturnValue(of(mockPhoto));
    fixture.detectChanges();

    const removeBtnEl = fixture.debugElement.query(By.css('.photo-detail__remove-btn'));
    expect(removeBtnEl).toBeTruthy();

    removeBtnEl.triggerEventHandler('click', null);

    expect(favoritesServiceMock.removeFavorite).toHaveBeenCalledWith('42');
    expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith(
      'Removed from favorites',
      'Close',
      { duration: 3000 },
    );
    expect(router.navigate).toHaveBeenCalledWith(['/favorites']);
  });

  it('should prevent multiple clicks while removeFavorite observable is pending', () => {
    photoServiceMock.getPhotoById.mockReturnValue(of(mockPhoto));
    const removeSubject = new Subject<void>();
    favoritesServiceMock.removeFavorite.mockReturnValue(removeSubject.asObservable());

    fixture.detectChanges();

    const removeBtnEl = fixture.debugElement.query(By.css('.photo-detail__remove-btn'));
    expect(removeBtnEl).toBeTruthy();

    // First click initiates pending operation
    removeBtnEl.triggerEventHandler('click', null);
    expect(favoritesServiceMock.removeFavorite).toHaveBeenCalledTimes(1);

    // Second click while pending is ignored
    removeBtnEl.triggerEventHandler('click', null);
    expect(favoritesServiceMock.removeFavorite).toHaveBeenCalledTimes(1);

    // Complete the pending operation
    removeSubject.next();
    removeSubject.complete();

    expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith(
      'Removed from favorites',
      'Close',
      { duration: 3000 },
    );
    expect(router.navigate).toHaveBeenCalledWith(['/favorites']);
  });

  it('should display loading indicator while loading photo', () => {
    const photoSubject = new Subject<Photo>();
    photoServiceMock.getPhotoById.mockReturnValue(photoSubject.asObservable());

    fixture.detectChanges();

    expect(component['isLoading']()).toBe(true);
    const loadingEl = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loadingEl).toBeTruthy();
  });

  it('should display ErrorStateComponent when photo fetch fails with a generic error and support reload retry', () => {
    photoServiceMock.getPhotoById.mockReturnValueOnce(throwError(() => new Error('Server error')));
    fixture.detectChanges();

    expect(component['errorState']()).toBe('error');
    const errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeTruthy();

    // Test retry
    photoServiceMock.getPhotoById.mockReturnValueOnce(of(mockPhoto));
    const retryBtn = fixture.nativeElement.querySelector('.error-state__reload-btn');
    retryBtn.click();
    fixture.detectChanges();

    expect(photoServiceMock.getPhotoById).toHaveBeenCalledTimes(2);
    expect(component['errorState']()).toBe('none');
    expect(component['photo']()).toEqual(mockPhoto);
  });

  it('should display not found component when photo fetch returns 404', () => {
    photoServiceMock.getPhotoById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    fixture.detectChanges();

    expect(component['errorState']()).toBe('not-found');
    const notFoundEl = fixture.debugElement.query(By.directive(NotFoundComponent));
    expect(notFoundEl).toBeTruthy();
  });
});
