import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';

import { PhotosComponent } from './photos.component';
import { PhotoService } from '../../core/services/photo.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { NotificationService } from '../../core/services/notification.service';
import { Photo } from '../../core/models/photo.model';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';

describe('PhotosComponent', () => {
  let component: PhotosComponent;
  let fixture: ComponentFixture<PhotosComponent>;
  let photoServiceMock: {
    getPhotos: ReturnType<typeof vi.fn>;
    getPhotoById: ReturnType<typeof vi.fn>;
    mapIdToPhoto: ReturnType<typeof vi.fn>;
  };
  let favoritesServiceMock: {
    addFavorite: ReturnType<typeof vi.fn>;
    removeFavorite: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: {
    showError: ReturnType<typeof vi.fn>;
    showSuccess: ReturnType<typeof vi.fn>;
    showInfo: ReturnType<typeof vi.fn>;
  };
  let errorActionSubject: Subject<void>;

  const generateMockPhotos = (count: number, startId = 1): Photo[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `${startId + i}`,
      url: `https://picsum.photos/id/${startId + i}/200/300`,
    }));

  beforeEach(async () => {
    errorActionSubject = new Subject<void>();

    photoServiceMock = {
      getPhotos: vi.fn(),
      getPhotoById: vi.fn(),
      mapIdToPhoto: vi.fn(),
    };
    favoritesServiceMock = {
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
    };
    notificationServiceMock = {
      showError: vi.fn().mockReturnValue({
        onAction: () => errorActionSubject.asObservable(),
      }),
      showSuccess: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PhotosComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PhotoService, useValue: photoServiceMock },
        { provide: FavoritesService, useValue: favoritesServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    })
      .overrideComponent(PhotosComponent, {
        set: {
          providers: [{ provide: NotificationService, useValue: notificationServiceMock }],
        },
      })
      .compileComponents();
  });

  it('should load initial page on init', () => {
    const initialPhotos = generateMockPhotos(18);
    photoServiceMock.getPhotos.mockReturnValue(of(initialPhotos));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(photoServiceMock.getPhotos).toHaveBeenCalledWith(1, 18);
    expect(component['allPhotos']().length).toBe(18);
    expect(component['rows']().length).toBe(6);
    expect(component['hasMore']()).toBe(true);
  });

  it('should display app-loading during initial fetch when photos are empty', () => {
    const photosSubject = new Subject<Photo[]>();
    photoServiceMock.getPhotos.mockReturnValue(photosSubject.asObservable());

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector('app-loading');
    expect(loadingEl).toBeTruthy();
  });

  it('should set hasMore to false when returned photos count is less than pageSize', () => {
    const partialPhotos = generateMockPhotos(10);
    photoServiceMock.getPhotos.mockReturnValue(of(partialPhotos));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(photoServiceMock.getPhotos).toHaveBeenCalledWith(1, 18);
    expect(component['allPhotos']().length).toBe(10);
    expect(component['hasMore']()).toBe(false);
  });

  it('should not load next page if currently loading or hasMore is false', () => {
    const photosSubject = new Subject<Photo[]>();
    photoServiceMock.getPhotos.mockReturnValue(photosSubject.asObservable());

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['isLoading']()).toBe(true);

    // Calling loadNextPage while already loading should not make another call
    component['loadNextPage']();
    expect(photoServiceMock.getPhotos).toHaveBeenCalledTimes(1);

    // Complete the first call with terminal page
    photosSubject.next(generateMockPhotos(5));
    photosSubject.complete();

    expect(component['isLoading']()).toBe(false);
    expect(component['hasMore']()).toBe(false);

    // Calling loadNextPage when hasMore is false should not trigger fetching
    component['loadNextPage']();
    expect(photoServiceMock.getPhotos).toHaveBeenCalledTimes(1);
  });

  it('should show success notification on adding photo to favorites', () => {
    photoServiceMock.getPhotos.mockReturnValue(of(generateMockPhotos(6)));
    favoritesServiceMock.addFavorite.mockReturnValue(of(true));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component['addToFavorites']('1');
    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledWith('1');
    expect(notificationServiceMock.showSuccess).toHaveBeenCalledWith(
      'Photo added to favorites successfully!',
    );
  });

  it('should show info notification when photo is already in favorites', () => {
    photoServiceMock.getPhotos.mockReturnValue(of(generateMockPhotos(6)));
    favoritesServiceMock.addFavorite.mockReturnValue(of(false));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component['addToFavorites']('1');
    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledWith('1');
    expect(notificationServiceMock.showInfo).toHaveBeenCalledWith(
      'Photo already in your favorites!',
    );
  });

  it('should prevent multiple clicks while addFavorite observable is pending', () => {
    photoServiceMock.getPhotos.mockReturnValue(of(generateMockPhotos(6)));
    const addFavoriteSubject = new Subject<boolean>();
    favoritesServiceMock.addFavorite.mockReturnValue(addFavoriteSubject.asObservable());

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // First click - initiates pending request
    component['addToFavorites']('1');
    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledTimes(1);

    // Second click on same photo while pending - should be ignored
    component['addToFavorites']('1');
    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledTimes(1);

    // Complete the pending request
    addFavoriteSubject.next(true);
    addFavoriteSubject.complete();

    // Subsequent click after completion is now permitted
    favoritesServiceMock.addFavorite.mockReturnValue(of(false));
    component['addToFavorites']('1');
    expect(favoritesServiceMock.addFavorite).toHaveBeenCalledTimes(2);
  });

  it('should show ErrorStateComponent when initial page fetch fails', () => {
    photoServiceMock.getPhotos.mockReturnValue(throwError(() => new Error('Network error')));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeTruthy();
    expect(component['isLoading']()).toBe(false);
  });

  it('should retry loading photos when user clicks retry on initial ErrorStateComponent', () => {
    photoServiceMock.getPhotos.mockReturnValueOnce(throwError(() => new Error('Network error')));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(photoServiceMock.getPhotos).toHaveBeenCalledTimes(1);
    let errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeTruthy();

    // Provide successful response for retry
    photoServiceMock.getPhotos.mockReturnValueOnce(of(generateMockPhotos(18)));

    const retryBtn = fixture.nativeElement.querySelector('.error-state__reload-btn');
    retryBtn.click();
    fixture.detectChanges();

    expect(photoServiceMock.getPhotos).toHaveBeenCalledTimes(2);
    expect(component['allPhotos']().length).toBe(18);

    errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeFalsy();
  });

  it('should show error notification with Retry action when loading subsequent page fails', () => {
    // Initial page load succeeds
    photoServiceMock.getPhotos.mockReturnValueOnce(of(generateMockPhotos(18)));

    fixture = TestBed.createComponent(PhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['allPhotos']().length).toBe(18);

    // Subsequent page fails
    photoServiceMock.getPhotos.mockReturnValueOnce(
      throwError(() => new Error('Subsequent page error')),
    );
    component['loadNextPage']();

    expect(notificationServiceMock.showError).toHaveBeenCalledWith(
      'Failed to load photos.',
      'Retry',
    );
  });
});
