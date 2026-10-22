import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const API_PREFIX = environment.apiUrl + '/';
const LOGIN_URL = `${environment.apiUrl}/auth/login`;

/**
 * Attaches the session token ONLY to our own API prefix (/mock-api/...), never
 * to any other URL. A 401 from the API on an authenticated call ends the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) return next(req);

  const auth = inject(AuthService);
  const token = req.url === LOGIN_URL ? null : auth.token();
  const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token) auth.logout('expired');
      return throwError(() => err);
    }),
  );
};
