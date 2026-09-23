import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { FavoritesComponent } from './favorites.component';
import { FavoritesService } from '../../core/services/favorites.service';
import { Photo } from '../../core/models/photo.model';
import { LoadingComponent } from '../../core/components/loading/loading.component';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';

describe('FavoritesComponent', () => {
  let fixture: ComponentFixture<FavoritesComponent>;
  let component: FavoritesComponent;
  let favoritesSubject: Subject<Photo[]>;
  let favoritesServiceMock: {
    getFavorites: ReturnType<typeof vi.fn>;
    addFavorite: ReturnType<typeof vi.fn>;
    removeFavorite: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockPhotos: Photo[] = [
    { id: '1', url: 'https://picsum.photos/id/1/300/450' },
    { id: '2', url: 'https://picsum.photos/id/2/300/450' },
  ];

  beforeEach(async () => {
    favoritesSubject = new Subject<Photo[]>();
    favoritesServiceMock = {
      getFavorites: vi.fn().mockReturnValue(favoritesSubject.asObservable()),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [provideRouter([]), { provide: FavoritesService, useValue: favoritesServiceMock }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
  });

  it('should create the favorites component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show loading indicator while fetching favorites', () => {
    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loadingEl).toBeTruthy();

    const emptyEl = fixture.nativeElement.querySelector('.favorites__empty');
    expect(emptyEl).toBeFalsy();
  });

  it('should show empty state when favorites load with empty array', () => {
    fixture.detectChanges();
    favoritesSubject.next([]);
    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loadingEl).toBeFalsy();

    const emptyEl = fixture.nativeElement.querySelector('.favorites__empty');
    expect(emptyEl).toBeTruthy();
  });

  it('should show grid when favorites load with photo items', () => {
    fixture.detectChanges();
    favoritesSubject.next(mockPhotos);
    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loadingEl).toBeFalsy();

    const gridItems = fixture.nativeElement.querySelectorAll('.favorites__grid-item');
    expect(gridItems.length).toBe(2);
  });

  it('should show error state when getFavorites fails', () => {
    fixture.detectChanges();
    favoritesSubject.error(new Error('Failed to load'));
    fixture.detectChanges();

    const loadingEl = fixture.debugElement.query(By.directive(LoadingComponent));
    expect(loadingEl).toBeFalsy();

    const errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeTruthy();
  });

  it('should retry loading favorites when retry is triggered on error state', () => {
    fixture.detectChanges();
    favoritesSubject.error(new Error('Network error'));
    fixture.detectChanges();

    let errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeTruthy();

    // Prepare a new subject for retry
    const retrySubject = new Subject<Photo[]>();
    favoritesServiceMock.getFavorites.mockReturnValue(retrySubject.asObservable());

    const retryBtn = fixture.nativeElement.querySelector('.error-state__reload-btn');
    retryBtn.click();
    fixture.detectChanges();

    expect(favoritesServiceMock.getFavorites).toHaveBeenCalledTimes(2);

    // Emit recovered data
    retrySubject.next(mockPhotos);
    fixture.detectChanges();

    errorEl = fixture.debugElement.query(By.directive(ErrorStateComponent));
    expect(errorEl).toBeFalsy();

    const gridItems = fixture.nativeElement.querySelectorAll('.favorites__grid-item');
    expect(gridItems.length).toBe(2);
  });

  it('should navigate to photo detail on card click', () => {
    fixture.detectChanges();
    favoritesSubject.next(mockPhotos);
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('app-photo-card'));
    card.triggerEventHandler('cardClick', '1');

    expect(router.navigate).toHaveBeenCalledWith(['/photos', '1']);
  });
});
