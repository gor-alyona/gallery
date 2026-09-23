import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../../core/services/favorites.service';
import { PhotoCardComponent } from '../../core/components/photo-card/photo-card.component';
import { ExploreButtonComponent } from '../../core/components/explore-button/explore-button.component';
import { LoadingComponent } from '../../core/components/loading/loading.component';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';
import { Photo } from '../../core/models/photo.model';

@Component({
  selector: 'app-favorites',
  imports: [
    MatIconModule,
    PhotoCardComponent,
    ExploreButtonComponent,
    LoadingComponent,
    ErrorStateComponent,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly favorites = signal<Photo[] | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly hasError = signal<boolean>(false);

  protected readonly goToPhotosAction = { route: '/', label: 'Explore Photos' };

  private favoritesSubscription?: Subscription;

  ngOnInit(): void {
    this.loadFavorites();
  }

  protected loadFavorites(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.favoritesSubscription?.unsubscribe();
    this.favoritesSubscription = this.favoritesService
      .getFavorites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => {
          this.favorites.set(photos);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  protected goToDetails(id: string): void {
    void this.router.navigate(['/photos', id]);
  }
}
