import { Observable } from 'rxjs';
import { Photo } from '../models/photo.model';

export abstract class FavoritesService {
  abstract getFavorites(): Observable<Photo[]>;
  abstract addFavorite(id: string): Observable<boolean>;
  abstract removeFavorite(id: string): Observable<void>;
}
