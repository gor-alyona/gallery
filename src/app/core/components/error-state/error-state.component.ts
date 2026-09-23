import { booleanAttribute, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExploreButtonComponent } from '../explore-button/explore-button.component';

export interface ErrorSecondaryAction {
  route: string;
  label: string;
  icon?: string | null;
}

@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule, MatIconModule, ExploreButtonComponent],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly title = input('Something went wrong');
  readonly message = input('Please try again later.');
  readonly icon = input('error_outline');
  readonly retryLabel = input('Reload');
  readonly showRetry = input(false, { transform: booleanAttribute });
  readonly secondaryAction = input<ErrorSecondaryAction | null>(null);

  readonly retry = output<void>();

  protected onRetry(): void {
    this.retry.emit();
  }
}
