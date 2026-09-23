import { Router } from '@angular/router';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, Subscription } from 'rxjs';

import { Photo } from '../../core/models/photo.model';
import { PhotoService } from '../../core/services/photo.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotFoundComponent } from '../../core/components/not-found/not-found.component';
import { LoadingComponent } from '../../core/components/loading/loading.component';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';
import { withLoading } from '../../core/rxjs/operators';
import { PhotoCardComponent } from '../../core/components/photo-card/photo-card.component';

@Component({
  selector: 'app-photo-detail',
  imports: [
    NotFoundComponent,
    LoadingComponent,
    ErrorStateComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PhotoCardComponent,
  ],
  templateUrl: './photo-detail.component.html',
  styleUrl: './photo-detail.component.scss',
})
export class PhotoDetailComponent {
  private readonly photoService = inject(PhotoService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly photo = signal<Photo | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isImageLoaded = signal(false);
  protected readonly errorState = signal<'none' | 'not-found' | 'error'>('none');

  protected readonly notFoundAction = { route: '/', label: 'Back to Photos' };
  protected readonly goToFavoritesAction = { route: '/favorites', label: 'Back to Favorites' };

  private isRemovingFavorite = false;

  constructor() {
    effect((onCleanup) => {
      const currentId = this.id();
      const sub = this.loadPhoto(currentId);
      onCleanup(() => {
        sub.unsubscribe();
      });
    });
  }

  protected removeFromFavorites(id: string): void {
    if (this.isRemovingFavorite) {
      return;
    }
    this.isRemovingFavorite = true;

    this.favoritesService
      .removeFavorite(id)
      .pipe(
        finalize(() => {
          this.isRemovingFavorite = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notificationService.showSuccess('Removed from favorites', 'Close', { duration: 3000 });
        void this.router.navigate(['/favorites']);
      });
  }

  protected loadPhoto(currentId: string): Subscription {
    this.errorState.set('none');
    this.photo.set(null);
    this.isImageLoaded.set(false);

    return this.photoService
      .getPhotoById(currentId)
      .pipe(withLoading(this.isLoading))
      .subscribe({
        next: (p) => {
          this.photo.set(p);
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.errorState.set('not-found');
          } else {
            this.errorState.set('error');
          }
        },
      });
  }
}
