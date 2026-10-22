/**
 * Public, build-time configuration. Everything here ends up in the browser
 * bundle — never put secrets in this file.
 *
 * `apiUrl` is a virtual prefix answered in-browser by the mock backend
 * interceptor (src/app/core/mock/mock-backend.interceptor.ts). No real server.
 */
export const environment = {
  production: false,
  apiUrl: '/mock-api',
  /** Session lifetime for the demo admin login (minutes). */
  sessionMinutes: 120,
};
