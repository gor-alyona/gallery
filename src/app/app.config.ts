import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { PhotoService } from './core/services/photo.service';
import { MockPhotoService } from './core/services/mock-photo.service';
import { FavoritesService } from './core/services/favorites.service';
import { MockFavoritesService } from './core/services/mock-favorites.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    { provide: PhotoService, useClass: MockPhotoService },
    { provide: FavoritesService, useClass: MockFavoritesService },
  ],
};
