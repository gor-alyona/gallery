import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { Photo } from '../models/photo.model';
import { FavoritesService } from './favorites.service';
import { MockFavoritesService } from './mock-favorites.service';
import { StorageService } from './storage.service';
import { PhotoService } from './photo.service';

const mockPhoto1: Photo = { id: '1', url: 'https://picsum.photos/id/1/200/300' };
const mockPhoto2: Photo = { id: '2', url: 'https://picsum.photos/id/2/200/300' };

class MockPhotoServiceImpl {
  mapIdToPhoto(id: string): Photo {
    return { id, url: `https://picsum.photos/id/${id}/200/300` };
  }
}

describe('MockFavoritesService', () => {
  let service: FavoritesService;
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        { provide: FavoritesService, useClass: MockFavoritesService },
        StorageService,
        { provide: PhotoService, useClass: MockPhotoServiceImpl },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    storageService = TestBed.inject(StorageService);
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty favorites if storage is empty', async () => {
    const favorites = await firstValueFrom(service.getFavorites());
    expect(favorites).toEqual([]);
  });

  it('should initialize with stored favorites if available', async () => {
    localStorage.setItem('gallery_favorites', JSON.stringify(['1']));

    const freshService = TestBed.runInInjectionContext(() => new MockFavoritesService());
    const favorites = await firstValueFrom(freshService.getFavorites());
    expect(favorites).toEqual([mockPhoto1]);
  });

  it('should add photo to favorites and persist in storage', async () => {
    const added = await firstValueFrom(service.addFavorite(mockPhoto1.id));
    expect(added).toBe(true);

    const favorites = await firstValueFrom(service.getFavorites());
    expect(favorites).toEqual([mockPhoto1]);

    const stored = storageService.getItem<string[]>('gallery_favorites');
    expect(stored).toEqual(['1']);
  });

  it('should not add duplicate photo', async () => {
    await firstValueFrom(service.addFavorite(mockPhoto1.id));
    const addedAgain = await firstValueFrom(service.addFavorite(mockPhoto1.id));

    expect(addedAgain).toBe(false);
    const favorites = await firstValueFrom(service.getFavorites());
    expect(favorites.length).toBe(1);
  });

  it('should remove photo from favorites and update storage', async () => {
    await firstValueFrom(service.addFavorite(mockPhoto1.id));
    await firstValueFrom(service.addFavorite(mockPhoto2.id));

    let favorites = await firstValueFrom(service.getFavorites());
    expect(favorites.length).toBe(2);

    await firstValueFrom(service.removeFavorite(mockPhoto1.id));

    favorites = await firstValueFrom(service.getFavorites());
    expect(favorites).toEqual([mockPhoto2]);

    const stored = storageService.getItem<string[]>('gallery_favorites');
    expect(stored).toEqual(['2']);
  });

  it('should synchronize favorites when a cross-tab storage event is received', async () => {
    const emissions: Photo[][] = [];
    const sub = service.getFavorites().subscribe((favs) => emissions.push(favs));

    // Wait for initial emission with delayMin
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(emissions.length).toBe(1);
    expect(emissions[0]).toEqual([]);

    const event = new StorageEvent('storage', {
      key: 'gallery_favorites',
      newValue: JSON.stringify(['2', '1']),
      storageArea: window.localStorage,
    });
    window.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(emissions.length).toBe(2);
    expect(emissions[1]).toEqual([mockPhoto2, mockPhoto1]);

    sub.unsubscribe();
  });
});
