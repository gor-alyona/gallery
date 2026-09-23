import { WritableSignal } from '@angular/core';

import { combineLatestWith, defer, finalize, map, Observable, OperatorFunction, timer } from 'rxjs';

export function delayMin<T>(ms = 300): OperatorFunction<T, T> {
  return (source$: Observable<T>) =>
    source$.pipe(
      combineLatestWith(timer(ms)),
      map(([value]) => value),
    );
}

export function withLoading<T>(isLoading: WritableSignal<boolean>): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    defer(() => {
      isLoading.set(true);
      return source.pipe(finalize(() => isLoading.set(false)));
    });
}
