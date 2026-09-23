import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  describe('Browser Platform', () => {
    let service: StorageService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [StorageService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(StorageService);
      localStorage.clear();
      sessionStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should be created and indicate browser platform', () => {
      expect(service).toBeTruthy();
      expect(service.isBrowser).toBe(true);
    });

    it('should store and retrieve data in localStorage', () => {
      const data = { id: '1', title: 'Test Photo' };
      const saved = service.setItem('test_key', data);

      expect(saved).toBe(true);
      expect(service.getItem('test_key')).toEqual(data);
    });

    it('should store and retrieve data in sessionStorage', () => {
      const sessionData = { theme: 'dark' };
      service.setItem('session_key', sessionData, 'session');

      expect(service.getItem('session_key', null, 'session')).toEqual(sessionData);
      expect(service.getItem('session_key', null, 'local')).toBeNull();
    });

    it('should return defaultValue when key does not exist', () => {
      const result = service.getItem('missing_key', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('should return defaultValue on corrupted/invalid JSON without throwing', () => {
      localStorage.setItem('corrupt_key', 'not a json {{{');
      const result = service.getItem('corrupt_key', ['default']);
      expect(result).toEqual(['default']);
    });

    it('should remove item from storage', () => {
      service.setItem('to_remove', { hello: 'world' });
      expect(service.getItem('to_remove')).toBeTruthy();

      const removed = service.removeItem('to_remove');
      expect(removed).toBe(true);
      expect(service.getItem('to_remove')).toBeNull();
    });

    it('should clear all items in specified storage', () => {
      service.setItem('k1', 'v1');
      service.setItem('k2', 'v2');
      service.setItem('s1', 'v3', 'session');

      service.clear('local');

      expect(service.getItem('k1')).toBeNull();
      expect(service.getItem('k2')).toBeNull();
      expect(service.getItem('s1', null, 'session')).toBe('v3');
    });

    it('should notify via watchKey when a storage event fires for the key', () => {
      let receivedValue: unknown = null;
      const sub = service.watchKey<{ id: string }>('sync_key').subscribe((val) => {
        receivedValue = val;
      });

      const event = new StorageEvent('storage', {
        key: 'sync_key',
        newValue: JSON.stringify({ id: 'photo-42' }),
        storageArea: window.localStorage,
      });
      window.dispatchEvent(event);

      expect(receivedValue).toEqual({ id: 'photo-42' });
      sub.unsubscribe();
    });
  });

  describe('Server Platform (SSR)', () => {
    let service: StorageService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [StorageService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(StorageService);
    });

    it('should indicate server platform', () => {
      expect(service.isBrowser).toBe(false);
    });

    it('should safely return default value on getItem', () => {
      const result = service.getItem('any_key', 'fallback_val');
      expect(result).toBe('fallback_val');
    });

    it('should return false on setItem, removeItem, and clear without erroring', () => {
      expect(service.setItem('key', { test: true })).toBe(false);
      expect(service.removeItem('key')).toBe(false);
      expect(service.clear()).toBe(false);
    });

    it('should complete watchKey immediately on server', () => {
      let completed = false;
      service.watchKey('key').subscribe({
        complete: () => {
          completed = true;
        },
      });
      expect(completed).toBe(true);
    });
  });
});
