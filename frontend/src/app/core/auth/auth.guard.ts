import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Admin routes require a valid, unexpired session with a known role.
 * UX only — the (mock) backend enforces roles on every request.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const role = auth.role();
  if (auth.isAuthenticated() && (role === 'admin' || role === 'viewer')) return true;
  return inject(Router).createUrlTree(['/admin/login']);
};

/** Keeps signed-in users away from the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/admin']) : true;
};
