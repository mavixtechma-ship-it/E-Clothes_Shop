import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const KEY = 'loomline.theme';
type Theme = 'light' | 'dark';

/** Light/dark toggle. Adds `.app-dark` on <html> (PrimeNG + Tailwind both key off it). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private doc = inject(DOCUMENT);
  private _theme = signal<Theme>(this.initial());
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.apply(this._theme());
  }

  toggle(): void {
    const next: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    // Apply the class before the signal changes so anything reading CSS tokens sees the new values.
    this.apply(next);
    this._theme.set(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  private apply(theme: Theme): void {
    const root = this.doc.documentElement;
    root.classList.toggle('app-dark', theme === 'dark');
    root.style.colorScheme = theme;
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
