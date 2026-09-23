import { Observable } from 'rxjs';
import { Photo } from '../models/photo.model';

export abstract class PhotoService {
  abstract getPhotos(page: number, limit: number): Observable<Photo[]>;
  abstract getPhotoById(id: string): Observable<Photo>;
  abstract mapIdToPhoto(id: string, widthPx?: number): Photo;
}
