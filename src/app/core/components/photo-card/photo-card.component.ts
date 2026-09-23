import { Component, signal, computed, input, output, booleanAttribute } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Photo } from '../../models/photo.model';
import { environment } from '../../../../environments/environment';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-photo-card',
  imports: [MatCardModule, MatIconModule, NgOptimizedImage],
  templateUrl: './photo-card.component.html',
  styleUrl: './photo-card.component.scss',
})
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
  readonly clickable = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly altText = input<string | null>(null);

  readonly cardClick = output<string>();

  protected readonly imageLoaded = signal(false);
  protected readonly hasError = signal(false);

  protected readonly imageRatio = `${environment.imageRatio.x} / ${environment.imageRatio.y}`;

  protected readonly computedAriaLabel = computed(() => {
    const customLabel = this.ariaLabel();
    if (customLabel) {
      return customLabel;
    }
    return this.clickable()
      ? `Add photo with ID ${this.photo().id} to favorites`
      : `Photo with ID ${this.photo().id}`;
  });

  protected readonly computedAltText = computed(() => {
    const customAlt = this.altText();
    return customAlt || `Photo with ID ${this.photo().id}`;
  });

  protected onImageLoaded(): void {
    this.imageLoaded.set(true);
  }

  protected onImageError(): void {
    this.hasError.set(true);
    this.imageLoaded.set(true);
  }

  protected onCardClicked(): void {
    if (!this.clickable()) {
      return;
    }
    this.cardClick.emit(this.photo().id);
  }
}
