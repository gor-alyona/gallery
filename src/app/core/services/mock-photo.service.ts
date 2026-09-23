import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Photo } from '../models/photo.model';
import { PhotoService } from './photo.service';
import { delayMin } from '../rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * @returns A random delay between 200 and 300ms
 */
function getRandomDelay(): number {
  return Math.round(Math.random() * 100 + 200);
}

interface PicsumItem {
  id: string;
}

@Injectable()
export class MockPhotoService extends PhotoService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl;

  override getPhotos(page: number, limit: number): Observable<Photo[]> {
    const endpoint = `${this.baseUrl}/v2/list?page=${page}&limit=${limit}`;
    return this.http.get<PicsumItem[]>(endpoint).pipe(
      map((items) => items.map((item) => this.mapIdToPhoto(item.id))),
      delayMin(getRandomDelay()),
    );
  }

  override getPhotoById(id: string): Observable<Photo> {
    const endpoint = `${this.baseUrl}/id/${id}/info`;

    return this.http.get<PicsumItem>(endpoint).pipe(
      map((item) => this.mapIdToPhoto(item.id, 2000)),
      delayMin(getRandomDelay()),
    );
  }

  override mapIdToPhoto(id: string, widthPx = 200): Photo {
    const aspectRatio = environment.imageRatio;
    const { width, height } = this.aspectRatioToWidthHeight(aspectRatio, widthPx);
    return {
      id,
      url: `${this.baseUrl}/id/${id}/${width}/${height}`,
    };
  }

  private aspectRatioToWidthHeight(
    aspectRatio: { x: number; y: number },
    width: number,
  ): { width: number; height: number } {
    return {
      width: width,
      height: width * (aspectRatio.y / aspectRatio.x),
    };
  }
}
