import { Routes } from '@angular/router';
import { type Action } from './core/components/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Gallery - Photos',
    loadComponent: () =>
      import('./features/photos/photos.component').then((m) => m.PhotosComponent),
  },
  {
    path: 'favorites',
    title: 'Gallery - Favorites',
    loadComponent: () =>
      import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent),
  },
  {
    path: 'photos/:id',
    title: 'Gallery - Photo Details',
    loadComponent: () =>
      import('./features/photo-detail/photo-detail.component').then((m) => m.PhotoDetailComponent),
  },
  {
    path: '**',
    title: 'Gallery - Page Not Found',
    loadComponent: () =>
      import('./core/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: {
      description: 'Page not found',
      action: {
        route: '/',
        label: 'Back to Photos',
      } as Action,
    },
  },
];
