import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { FavoritesService } from './favorites.service';
import { StorageService } from './storage.service';
import { PhotoService } from './photo.service';
import { Photo } from '../models/photo.model';
import { delayMin } from '../rxjs/operators';
/**
 * @returns A random delay between 200 and 300ms
 */
function getRandomDelay(): number {
  return Math.round(Math.random() * 100 + 200);
}

@Injectable()
export class MockFavoritesService implements FavoritesService {
  private readonly storageService = inject(StorageService);
  private readonly photoService = inject(PhotoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'gallery_favorites';

  private readonly favoriteIds$ = new BehaviorSubject<string[]>(
    this.storageService.getItem<string[]>(this.storageKey, []) ?? [],
  );

  constructor() {
    this.storageService
      .watchKey<string[]>(this.storageKey)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((externalFavorites) => {
        this.favoriteIds$.next(externalFavorites ?? []);
      });
  }

  getFavorites(): Observable<Photo[]> {
    return this.favoriteIds$.pipe(
      map((ids) => ids.map((id) => this.photoService.mapIdToPhoto(id))),
      delayMin(getRandomDelay()),
    );
  }

  addFavorite(id: string): Observable<boolean> {
    const current = this.favoriteIds$.value;
    if (current.includes(id)) {
      return of(false).pipe(delayMin(getRandomDelay()));
    }
    const updated = [id, ...current];
    this.favoriteIds$.next(updated);
    this.saveFavoritesToStorage(updated);
    return of(true).pipe(delayMin(getRandomDelay()));
  }

  removeFavorite(id: string): Observable<void> {
    const current = this.favoriteIds$.value;
    const updated = current.filter((p) => p !== id);
    this.favoriteIds$.next(updated);
    this.saveFavoritesToStorage(updated);
    return of(undefined).pipe(delayMin(getRandomDelay()));
  }

  private saveFavoritesToStorage(favorites: string[]): void {
    this.storageService.setItem(this.storageKey, favorites);
  }
}
