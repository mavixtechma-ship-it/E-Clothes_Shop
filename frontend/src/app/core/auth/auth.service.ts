import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api.service';
import { LoginResponse } from '../models';
import { SESSION_KEY, Session } from './auth.models';

/** Validates the shape and expiry of a stored session. */
export function isValidSession(s: unknown): s is Session {
  if (!s || typeof s !== 'object') return false;
  const v = s as Record<string, unknown>;
  return (
    typeof v['token'] === 'string' &&
    /^[0-9a-f]{64}$/.test(v['token']) &&
    typeof v['username'] === 'string' &&
    (v['role'] === 'admin' || v['role'] === 'viewer') &&
    typeof v['expiresAt'] === 'number' &&
    v['expiresAt'] > Date.now()
  );
}

/** Admin-area session: memory signal mirrored to sessionStorage, with expiry + role. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private timer: ReturnType<typeof setTimeout> | undefined;

  private _session = signal<Session | null>(this.restore());
  readonly session = this._session.asReadonly();
  readonly username = computed(() => this._session()?.username ?? null);
  readonly role = computed(() => this._session()?.role ?? null);
  /** Only admins may create / edit / delete / change status (UX; the API enforces it). */
  readonly canEdit = computed(() => this._session()?.role === 'admin');

  constructor() {
    this.scheduleExpiry();
  }

  /** True only for a well-formed, unexpired session. */
  isAuthenticated(): boolean {
    const s = this._session();
    if (isValidSession(s)) return true;
    if (s) this.clear();
    return false;
  }

  token(): string | null {
    return this.isAuthenticated() ? this._session()!.token : null;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.api.login({ username, password }).pipe(
      tap((res) => {
        const session: Session = {
          token: res.token,
          username: res.username,
          role: res.role,
          expiresAt: res.expiresAt,
        };
        this._session.set(session);
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
          /* memory only */
        }
        this.scheduleExpiry();
      }),
    );
  }

  logout(reason?: 'expired'): void {
    this.clear();
    this.router.navigate(['/admin/login'], {
      replaceUrl: true,
      queryParams: reason ? { reason } : {},
    });
  }

  private clear(): void {
    clearTimeout(this.timer);
    this._session.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  private scheduleExpiry(): void {
    clearTimeout(this.timer);
    const s = this._session();
    if (!s) return;
    this.timer = setTimeout(() => this.logout('expired'), Math.max(0, s.expiresAt - Date.now()));
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isValidSession(parsed)) return parsed;
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}
