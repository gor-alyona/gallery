import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-explore-button',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './explore-button.component.html',
  styleUrl: './explore-button.component.scss',
})
export class ExploreButtonComponent {
  readonly route = input('/');
  readonly label = input('Explore Photos');
  readonly icon = input<string | null>('photo_library');
}
