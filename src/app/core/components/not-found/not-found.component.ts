import { Component, input } from '@angular/core';
import { ExploreButtonComponent } from '../explore-button/explore-button.component';

export interface Action {
  route: string;
  label: string;
}

@Component({
  selector: 'app-not-found',
  imports: [ExploreButtonComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  readonly description = input.required<string>();
  readonly action = input<Action>();
}
