import { Injectable, computed, signal } from '@angular/core';
import { readJson, writeJson } from './utils';

const KEY = 'loomline.wishlist';

/** Client-side wishlist (per browser, localStorage). */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private _ids = signal<Set<number>>(this.read());
  readonly ids = this._ids.asReadonly();
  readonly count = computed(() => this._ids().size);

  has(id: number): boolean {
    return this._ids().has(id);
  }

  toggle(id: number): boolean {
    const next = new Set(this._ids());
    const on = !next.has(id);
    if (on) next.add(id);
    else next.delete(id);
    this._ids.set(next);
    writeJson('local', KEY, [...next]);
    return on;
  }

  private read(): Set<number> {
    const raw = readJson<unknown>('local', KEY, []);
    return new Set(Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n)) : []);
  }
}
