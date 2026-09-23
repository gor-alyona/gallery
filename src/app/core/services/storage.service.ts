import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { EMPTY, filter, fromEvent, map, Observable, share } from 'rxjs';

export type StorageType = 'local' | 'session';

@Service()
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  private getStorage(type: StorageType): Storage | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return type === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }

  getItem<T>(key: string, defaultValue: T | null = null, type: StorageType = 'local'): T | null {
    const storage = this.getStorage(type);
    if (!storage) {
      return defaultValue;
    }

    try {
      const rawValue = storage.getItem(key);
      if (rawValue === null) {
        return defaultValue;
      }
      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.warn(
        `[StorageService] Failed to read or parse key "${key}" from ${type}Storage:`,
        error,
      );
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T, type: StorageType = 'local'): boolean {
    const storage = this.getStorage(type);
    if (!storage) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to set key "${key}" in ${type}Storage:`, error);
      return false;
    }
  }

  removeItem(key: string, type: StorageType = 'local'): boolean {
    const storage = this.getStorage(type);
    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to remove key "${key}" from ${type}Storage:`, error);
      return false;
    }
  }

  clear(type: StorageType = 'local'): boolean {
    const storage = this.getStorage(type);
    if (!storage) {
      return false;
    }

    try {
      storage.clear();
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to clear ${type}Storage:`, error);
      return false;
    }
  }

  watchKey<T>(key: string, type: StorageType = 'local'): Observable<T | null> {
    if (!this.isBrowser) {
      return EMPTY;
    }

    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter((event) => {
        if (event.key !== key) {
          return false;
        }
        if (
          type === 'local' &&
          typeof window !== 'undefined' &&
          event.storageArea !== window.localStorage
        ) {
          return false;
        }
        if (
          type === 'session' &&
          typeof window !== 'undefined' &&
          event.storageArea !== window.sessionStorage
        ) {
          return false;
        }
        return true;
      }),
      map((event) => {
        if (event.newValue === null) {
          return null;
        }
        try {
          return JSON.parse(event.newValue) as T;
        } catch {
          return null;
        }
      }),
      share(),
    );
  }
}
