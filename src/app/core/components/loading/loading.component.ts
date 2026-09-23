import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {
  readonly message = input<string | null>('Loading...');
  readonly diameter = input(44);
  readonly role = input('status');
  readonly ariaLive = input<'polite' | 'assertive' | 'off'>('polite');
}
