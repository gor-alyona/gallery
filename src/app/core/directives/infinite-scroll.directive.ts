import { isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';

/**
 * Attaches to a sentinel element to detect when it scrolls into view and triggers data loading.
 *
 * Designed for infinite scrolling lists using the `IntersectionObserver` API. The consumer owns
 * pagination tracking, item storage, and termination states (`hasMore`).
 *
 * @example
 * ```html
 * <div class="scroll-container" #scrollContainer>
 *   @for (item of items(); track item.id) {
 *     <app-item-card [item]="item" />
 *   }
 *
 *   <!-- Sentinel element placed at the bottom of the list -->
 *   <div
 *     appInfiniteScroll
 *     [container]="scrollContainer"
 *     [distance]="300"
 *     [loading]="isLoading()"
 *     [hasMore]="hasMoreItems()"
 *     [disabled]="hasError()"
 *     (loadMore)="fetchNextPage()"
 *   ></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * The scrollable element to observe for intersections with the sentinel.
   * If `null` or omitted, the top-level document's viewport is used as the root.
   *
   * Must be a scrollable ancestor of the host element.
   */
  readonly container = input<Element | null>(null);

  /**
   * Distance in pixels before the sentinel reaches the viewport edge at which
   * `loadMore` should trigger.
   *
   * @throws {RangeError} If the provided value is negative or not a finite number.
   * @default 200
   */
  readonly distance = input(200);

  /**
   * Indicates whether an active data-fetching operation is in progress.
   *
   * When `true`, prevents duplicate emissions. Transitions from `true` to `false`
   * release the internal lock for future fetches.
   *
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Indicates whether additional pages of data are available to load.
   * When `false`, the sentinel will not trigger `loadMore`.
   *
   * @default true
   */
  readonly hasMore = input(true, { transform: booleanAttribute });

  /**
   * Explicit toggle to deactivate intersection emissions.
   * Useful for halting requests during transient network errors without unmounting the sentinel.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Emitted when the sentinel enters the active trigger zone, provided:
   * - `loading` is `false`
   * - `hasMore` is `true`
   * - `disabled` is `false`
   * - An existing request is not already awaiting the `loading` transition
   */
  readonly loadMore = output<void>();

  /**
   * Internal guard lock set immediately upon emitting `loadMore` to prevent
   * subsequent emissions before the consumer's `loading` signal can update.
   */
  private awaitingLoading = false;
  private lockTimeoutId?: ReturnType<typeof setTimeout>;

  constructor() {
    // Prevent execution and ReferenceErrors in Server-Side Rendering (SSR) environments
    if (!this.isBrowser) {
      return;
    }

    // Reset the internal lock once the consumer signals that loading has started or finished, or state changes
    effect(() => {
      this.loading();
      this.hasMore();
      this.disabled();
      this.awaitingLoading = false;
      if (this.lockTimeoutId) {
        clearTimeout(this.lockTimeoutId);
        this.lockTimeoutId = undefined;
      }
    });

    // Reconstruct the IntersectionObserver instance only when configuration parameters change
    effect((onCleanup) => {
      const root = this.container();
      const distance = this.distance();

      if (!Number.isFinite(distance) || distance < 0) {
        throw new RangeError(
          'appInfiniteScroll: [distance] must be a finite, non-negative number.',
        );
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.at(-1);
          if (!entry?.isIntersecting) {
            return;
          }

          // Evaluate state dynamically inside the callback without registering effect dependencies
          const canLoad =
            !this.awaitingLoading && !this.loading() && !this.disabled() && this.hasMore();

          if (canLoad) {
            this.awaitingLoading = true;
            if (this.lockTimeoutId) {
              clearTimeout(this.lockTimeoutId);
            }
            this.lockTimeoutId = setTimeout(() => {
              this.awaitingLoading = false;
            }, 5000);
            this.loadMore.emit();
          }
        },
        {
          root,
          rootMargin: `0px 0px ${distance}px 0px`,
          threshold: 0,
        },
      );

      observer.observe(this.element.nativeElement);

      onCleanup(() => {
        observer.disconnect();
        if (this.lockTimeoutId) {
          clearTimeout(this.lockTimeoutId);
          this.lockTimeoutId = undefined;
        }
      });
    });
  }
}
