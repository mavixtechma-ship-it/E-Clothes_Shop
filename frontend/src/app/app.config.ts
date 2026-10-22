import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockBackendInterceptor } from './core/mock/mock-backend.interceptor';
import { LoomlinePreset } from './theme/loomline-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // Order matters: auth adds the token, then the mock backend answers /mock-api.
    provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: false,
      theme: {
        preset: LoomlinePreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'primeng', order: 'tw-base, primeng, tw-utilities' },
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
