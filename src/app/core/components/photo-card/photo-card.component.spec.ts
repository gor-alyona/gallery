import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PhotoCardComponent } from './photo-card.component';
import { Photo } from '../../models/photo.model';
import { environment } from '../../../../environments/environment';

const mockPhoto: Photo = {
  id: 'photo-100',
  url: 'https://picsum.photos/id/100/300/300',
};

@Component({
  imports: [PhotoCardComponent],
  template: `
    <app-photo-card
      [photo]="photo()"
      [clickable]="clickable()"
      [ariaLabel]="ariaLabel()"
      [altText]="altText()"
      (cardClick)="onCardClick($event)"
    />
  `,
})
class TestHostComponent {
  readonly photo = signal<Photo>(mockPhoto);
  readonly clickable = signal<boolean>(false);
  readonly ariaLabel = signal<string | null>(null);
  readonly altText = signal<string | null>(null);

  clickedPhotoId: string | null = null;

  onCardClick(id: string): void {
    this.clickedPhotoId = id;
  }
}

describe('PhotoCardComponent', () => {
  let fixture: ComponentFixture<PhotoCardComponent>;
  let component: PhotoCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoCardComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('photo', mockPhoto);
    fixture.detectChanges();
  });

  it('should create the photo card component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default non-clickable state correctly', () => {
    const cardEl = fixture.nativeElement.querySelector('mat-card');
    const skeletonEl = fixture.nativeElement.querySelector('.skeleton-shimmer');
    const imgEl = fixture.nativeElement.querySelector('img');

    expect(cardEl.style.aspectRatio).toBe(`${environment.imageRatio.x} / ${environment.imageRatio.y}`);
    expect(cardEl.getAttribute('tabindex')).toBeNull();
    expect(cardEl.getAttribute('role')).toBeNull();
    expect(cardEl.getAttribute('aria-label')).toBe('Photo with ID photo-100');
    expect(cardEl.classList.contains('clickable')).toBe(false);

    expect(skeletonEl).not.toBeNull();
    expect(imgEl).not.toBeNull();
    expect(imgEl.getAttribute('alt')).toBe('Photo with ID photo-100');
    expect(imgEl.getAttribute('loading')).toBe('lazy');
  });

  it('should handle clickable state and emit cardClick on click and Enter keydown', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.clickable.set(true);
    hostFixture.detectChanges();

    const cardEl = hostFixture.nativeElement.querySelector('mat-card');
    const cardDebugEl = hostFixture.debugElement.query(By.css('mat-card'));

    expect(cardEl.getAttribute('tabindex')).toBe('0');
    expect(cardEl.getAttribute('role')).toBe('button');
    expect(cardEl.getAttribute('aria-label')).toBe('Add photo with ID photo-100 to favorites');
    expect(cardEl.classList.contains('clickable')).toBe(true);

    cardEl.click();
    expect(hostFixture.componentInstance.clickedPhotoId).toBe('photo-100');

    hostFixture.componentInstance.clickedPhotoId = null;
    cardDebugEl.triggerEventHandler('keydown.enter', {});
    expect(hostFixture.componentInstance.clickedPhotoId).toBe('photo-100');
  });

  it('should not emit cardClick when non-clickable card is clicked or receives Enter key', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.clickable.set(false);
    hostFixture.detectChanges();

    const cardEl = hostFixture.nativeElement.querySelector('mat-card');
    const cardDebugEl = hostFixture.debugElement.query(By.css('mat-card'));

    cardEl.click();
    expect(hostFixture.componentInstance.clickedPhotoId).toBeNull();

    cardDebugEl.triggerEventHandler('keydown.enter', {});
    expect(hostFixture.componentInstance.clickedPhotoId).toBeNull();
  });

  it('should support custom ariaLabel and altText inputs', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.componentInstance.ariaLabel.set('Custom Card Label');
    hostFixture.componentInstance.altText.set('Custom Alt Description');
    hostFixture.detectChanges();

    const cardEl = hostFixture.nativeElement.querySelector('mat-card');
    const imgEl = hostFixture.nativeElement.querySelector('img');

    expect(cardEl.getAttribute('aria-label')).toBe('Custom Card Label');
    expect(imgEl.getAttribute('alt')).toBe('Custom Alt Description');
  });

  it('should transition to loaded state when image load event fires', () => {
    const imgDebugEl = fixture.debugElement.query(By.css('img'));
    imgDebugEl.triggerEventHandler('load', {});
    fixture.detectChanges();

    const skeletonEl = fixture.nativeElement.querySelector('.skeleton-shimmer');
    const imgEl = fixture.nativeElement.querySelector('img');

    expect(skeletonEl).toBeNull();
    expect(imgEl.classList.contains('loaded')).toBe(true);
  });

  it('should transition to error placeholder state when image error event fires', () => {
    const imgDebugEl = fixture.debugElement.query(By.css('img'));
    imgDebugEl.triggerEventHandler('error', {});
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector('mat-card');
    const errorPlaceholder = fixture.nativeElement.querySelector('.error-placeholder');
    const skeletonEl = fixture.nativeElement.querySelector('.skeleton-shimmer');
    const imgEl = fixture.nativeElement.querySelector('img');

    expect(cardEl.classList.contains('has-error')).toBe(true);
    expect(skeletonEl).toBeNull();
    expect(imgEl).toBeNull();
    expect(errorPlaceholder).not.toBeNull();
    expect(errorPlaceholder.getAttribute('role')).toBe('status');
    expect(errorPlaceholder.textContent).toContain('Image unavailable');
  });
});
