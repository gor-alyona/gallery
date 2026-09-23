import { PLATFORM_ID, Component, signal, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly callback: IntersectionObserverCallback;
  readonly options?: IntersectionObserverInit;
  elements: Element[] = [];
  disconnected = false;

  root: Element | Document | null = null;
  rootMargin: string = '';
  scrollMargin: string = '';
  thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '0px';
    this.thresholds = options?.threshold
      ? Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold]
      : [0];
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.elements.push(element);
  }

  unobserve(element: Element): void {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect(): void {
    this.disconnected = true;
    this.elements = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  triggerIntersect(isIntersecting: boolean, target?: Element): void {
    const entry: IntersectionObserverEntry = {
      time: Date.now(),
      target: target ?? this.elements[0] ?? document.createElement('div'),
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
    };
    this.callback([entry], this);
  }

  static clear(): void {
    MockIntersectionObserver.instances = [];
  }

  static get latest(): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
  }
}

@Component({
  imports: [InfiniteScrollDirective],
  template: `
    <div
      #sentinel
      appInfiniteScroll
      [container]="container()"
      [distance]="distance()"
      [loading]="loading()"
      [hasMore]="hasMore()"
      [disabled]="disabled()"
      (loadMore)="onLoadMore()"
    ></div>
  `,
})
class TestHostComponent {
  readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  readonly container = signal<Element | null>(null);
  readonly distance = signal<number>(200);
  readonly loading = signal<boolean>(false);
  readonly hasMore = signal<boolean>(true);
  readonly disabled = signal<boolean>(false);

  loadCount = 0;
  onLoadMore(): void {
    this.loadCount++;
  }
}

describe('InfiniteScrollDirective', () => {
  describe('Browser Platform', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;
    let originalIntersectionObserver: typeof IntersectionObserver;

    beforeEach(async () => {
      MockIntersectionObserver.clear();
      originalIntersectionObserver = window.IntersectionObserver;
      window.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;

      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
      MockIntersectionObserver.clear();
    });

    it('should initialize and observe sentinel element with default options', () => {
      fixture.detectChanges();

      expect(MockIntersectionObserver.instances.length).toBe(1);
      const observer = MockIntersectionObserver.latest!;
      expect(observer.elements).toContain(host.sentinel().nativeElement);
      expect(observer.rootMargin).toBe('0px 0px 200px 0px');
      expect(observer.root).toBeNull();
    });

    it('should emit loadMore when sentinel enters the viewport and conditions are met', () => {
      fixture.detectChanges();
      const observer = MockIntersectionObserver.latest!;

      observer.triggerIntersect(true);

      expect(host.loadCount).toBe(1);
    });

    it('should not emit loadMore when entry is not intersecting', () => {
      fixture.detectChanges();
      const observer = MockIntersectionObserver.latest!;

      observer.triggerIntersect(false);

      expect(host.loadCount).toBe(0);
    });

    it('should not emit loadMore when loading is true', () => {
      host.loading.set(true);
      fixture.detectChanges();

      const observer = MockIntersectionObserver.latest!;
      observer.triggerIntersect(true);

      expect(host.loadCount).toBe(0);
    });

    it('should not emit loadMore when hasMore is false', () => {
      host.hasMore.set(false);
      fixture.detectChanges();

      const observer = MockIntersectionObserver.latest!;
      observer.triggerIntersect(true);

      expect(host.loadCount).toBe(0);
    });

    it('should not emit loadMore when disabled is true', () => {
      host.disabled.set(true);
      fixture.detectChanges();

      const observer = MockIntersectionObserver.latest!;
      observer.triggerIntersect(true);

      expect(host.loadCount).toBe(0);
    });

    it('should lock duplicate emissions (awaitingLoading) until loading signal transitions', () => {
      fixture.detectChanges();
      const observer = MockIntersectionObserver.latest!;

      // First intersection triggers loadMore and engages awaitingLoading lock
      observer.triggerIntersect(true);
      expect(host.loadCount).toBe(1);

      // Immediate second intersection should be ignored while awaiting consumer loading state
      observer.triggerIntersect(true);
      expect(host.loadCount).toBe(1);

      // Consumer sets loading = true; releases the internal lock
      host.loading.set(true);
      fixture.detectChanges();

      // Next page finishes loading: loading = false
      host.loading.set(false);
      fixture.detectChanges();

      // Subsequent intersection now successfully emits
      observer.triggerIntersect(true);
      expect(host.loadCount).toBe(2);
    });

    it('should use custom container as observer root', () => {
      const customContainer = document.createElement('div');
      host.container.set(customContainer);
      fixture.detectChanges();

      const observer = MockIntersectionObserver.latest!;
      expect(observer.root).toBe(customContainer);
    });

    it('should recreate observer with updated rootMargin when distance changes', () => {
      fixture.detectChanges();
      const firstObserver = MockIntersectionObserver.latest!;
      expect(firstObserver.rootMargin).toBe('0px 0px 200px 0px');

      host.distance.set(450);
      fixture.detectChanges();

      expect(firstObserver.disconnected).toBe(true);
      const secondObserver = MockIntersectionObserver.latest!;
      expect(secondObserver).not.toBe(firstObserver);
      expect(secondObserver.rootMargin).toBe('0px 0px 450px 0px');
      expect(secondObserver.elements).toContain(host.sentinel().nativeElement);
    });

    it('should throw RangeError if distance is negative or not a finite number', () => {
      host.distance.set(-100);
      expect(() => fixture.detectChanges()).toThrowError(
        /appInfiniteScroll: \[distance\] must be a finite, non-negative number\./,
      );
    });

    it('should throw RangeError if distance is NaN', () => {
      host.distance.set(Number.NaN);
      expect(() => fixture.detectChanges()).toThrowError(
        /appInfiniteScroll: \[distance\] must be a finite, non-negative number\./,
      );
    });

    it('should disconnect the observer when host component is destroyed', () => {
      fixture.detectChanges();
      const observer = MockIntersectionObserver.latest!;
      expect(observer.disconnected).toBe(false);

      fixture.destroy();

      expect(observer.disconnected).toBe(true);
    });
  });

  describe('Server Platform (SSR)', () => {
    let originalIntersectionObserver: typeof IntersectionObserver;

    beforeEach(async () => {
      MockIntersectionObserver.clear();
      originalIntersectionObserver = window.IntersectionObserver;
      // Simulate SSR environment where IntersectionObserver might not be defined or used
      window.IntersectionObserver =
        MockIntersectionObserver as unknown as typeof IntersectionObserver;

      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      }).compileComponents();
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
      MockIntersectionObserver.clear();
    });

    it('should not create IntersectionObserver or observe elements on server', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      expect(MockIntersectionObserver.instances.length).toBe(0);
    });
  });
});
