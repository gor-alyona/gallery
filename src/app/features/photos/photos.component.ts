import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Photo } from '../../core/models/photo.model';
import { PhotoService } from '../../core/services/photo.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { NotificationService } from '../../core/services/notification.service';
import { PhotoCardComponent } from '../../core/components/photo-card/photo-card.component';
import { LoadingComponent } from '../../core/components/loading/loading.component';
import { ErrorStateComponent } from '../../core/components/error-state/error-state.component';
import { InfiniteScrollDirective } from '../../core/directives/infinite-scroll.directive';
import { withLoading } from '../../core/rxjs/operators';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-photos',
  imports: [
    ScrollingModule,
    MatProgressSpinnerModule,
    PhotoCardComponent,
    LoadingComponent,
    ErrorStateComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.scss',
})
export class PhotosComponent implements OnInit {
  private readonly photoService = inject(PhotoService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly favoritesService = inject(FavoritesService);
  private readonly notificationService = inject(NotificationService);

  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  protected readonly isLoading = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly hasInitialError = signal(false);
  private readonly allPhotos = signal<Photo[]>([]);
  private readonly columns = signal<number>(3);
  private readonly containerWidth = signal<number>(1280);

  private readonly pendingFavoriteIds = new Set<string>();

  protected readonly rowHeight = computed(() => {
    const width = this.containerWidth();
    const cols = this.columns();
    const isMobile = width <= 640;
    const effectiveWidth = Math.min(width, 1280);
    const horizontalPadding = isMobile ? 32 : 48; // 1rem (16px) or 1.5rem (24px) each side
    const gap = isMobile ? 16 : 24; // 1rem (16px) or 1.5rem (24px)
    const verticalPadding = isMobile ? 16 : 24; // 0.5rem or 0.75rem top + bottom

    const availableWidth = Math.max(effectiveWidth - horizontalPadding, 0);
    const totalGap = (cols - 1) * gap;
    const cardWidth = Math.max((availableWidth - totalGap) / cols, 0);
    const cardHeight = Math.round(
      (cardWidth * environment.imageRatio.y) / environment.imageRatio.x,
    );

    return Math.max(cardHeight + verticalPadding, 100);
  });

  protected readonly rows = computed(() => {
    const cols = this.columns();
    const photos = this.allPhotos();
    const result: Photo[][] = [];

    for (let i = 0; i < photos.length; i += cols) {
      result.push(photos.slice(i, i + cols));
    }
    return result;
  });

  protected readonly gridColumnsStyle = computed(() => `repeat(${this.columns()}, minmax(0, 1fr))`);

  private readonly pageSize = environment.pageSize;
  private currentPage = 1;

  ngOnInit(): void {
    this.setupResponsiveLayout();
    this.setupResizeObserver();
    this.loadNextPage();
  }

  protected addToFavorites(id: string): void {
    if (this.pendingFavoriteIds.has(id)) {
      return;
    }
    this.pendingFavoriteIds.add(id);

    this.favoritesService
      .addFavorite(id)
      .pipe(
        finalize(() => this.pendingFavoriteIds.delete(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (isFav) => {
          if (isFav) {
            this.notificationService.showSuccess('Photo added to favorites successfully!');
          } else {
            this.notificationService.showInfo('Photo already in your favorites!');
          }
        },
        error: () => {
          this.notificationService.showError('Failed to add photo to favorites!');
        },
      });
  }

  protected loadNextPage(): void {
    if (this.isLoading() || !this.hasMore()) {
      return;
    }

    if (this.allPhotos().length === 0) {
      this.hasInitialError.set(false);
    }

    this.photoService
      .getPhotos(this.currentPage, this.pageSize)
      .pipe(withLoading(this.isLoading), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newPhotos) => {
          if (newPhotos.length < this.pageSize) {
            this.hasMore.set(false);
          }
          this.allPhotos.update((prev) => [...prev, ...newPhotos]);
          this.currentPage++;
        },
        error: (err) => {
          console.error('Failed to load photos:', err);
          if (this.allPhotos().length === 0) {
            this.hasInitialError.set(true);
          } else {
            const snackBarRef = this.notificationService.showError(
              'Failed to load photos.',
              'Retry',
            );
            snackBarRef
              .onAction()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.loadNextPage();
              });
          }
        },
      });
  }

  protected trackByRow(index: number, row: Photo[]): string {
    return row.length > 0 ? row[0].id : `${index}`;
  }

  private setupResponsiveLayout(): void {
    const mobileQuery = '(max-width: 639.98px)';
    const tabletQuery = '(min-width: 640px) and (max-width: 1023.98px)';
    const desktopQuery = '(min-width: 1024px)';

    this.breakpointObserver
      .observe([mobileQuery, tabletQuery, desktopQuery])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state.breakpoints[mobileQuery]) {
          this.columns.set(1);
        } else if (state.breakpoints[tabletQuery]) {
          this.columns.set(2);
        } else {
          this.columns.set(3);
        }
        this.viewport()?.checkViewportSize();
      });
  }

  private setupResizeObserver(): void {
    if (!this.isBrowser || typeof ResizeObserver === 'undefined') {
      return;
    }

    const host = this.hostElement.nativeElement;
    const initialWidth = host.clientWidth || window.innerWidth;
    if (initialWidth > 0) {
      this.containerWidth.set(initialWidth);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
        if (width > 0 && Math.abs(width - this.containerWidth()) > 2) {
          this.containerWidth.set(width);
          this.viewport()?.checkViewportSize();
        }
      }
    });

    resizeObserver.observe(host);

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
    });
  }
}
