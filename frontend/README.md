# Loomline — menswear store + admin studio (demo)

Angular 19 standalone app with a storefront and an admin "studio". It has **no
real backend**: every API call goes to the virtual prefix `/mock-api`, which is
answered in the browser by a mock `HttpInterceptorFn` from the JSON seed in
`src/assets/mock/`. Writes (orders, products, images, status changes) live in
memory until the page is reloaded.

Stack: Angular 19 · PrimeNG 19 (custom navy/sand preset on Aura) · PrimeIcons ·
Tailwind CSS 3 · Chart.js · self-hosted Manrope + Fraunces fonts.

## Run

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build → dist/loomline/browser
```

## Demo accounts

Two accounts exist: `admin` (full access) and `viewer` (read-only). Plaintext
passwords are in `../CREDENTIALS.md` (git-ignored). Only salted PBKDF2-SHA256
hashes (310,000 iterations) are in the source, in
`src/app/core/auth/credentials.config.ts`.

To rotate the passwords: `npm run hash-passwords` (rewrites both files).

> This is a demo access gate, not real security — anything shipped to the
> browser can be read and bypassed.

## Structure

```
src/app/
  core/
    api.service.ts            every HTTP call (all under /mock-api)
    auth/                     PBKDF2 verify (WebCrypto), session service, guard, interceptor
    mock/                     mock backend interceptor + in-memory db / session registry
    cart, wishlist, theme services, models.ts, utils.ts
  theme/loomline-preset.ts    PrimeNG preset (navy primary, sand surfaces, dark mode)
  shared/                     logo, product tile/image, KPI tile, page header, status tag, chart theme, EGP pipe
  store/                      shell (header, bag drawer, footer), home, shop, product, checkout, confirmation
  admin/                      login, shell (sidebar + topbar), overview, products, orders, reports
scripts/
  gen-mock.mjs                regenerates src/assets/mock/*.json + src/assets/products/*.svg
  gen-credentials.mjs         regenerates demo passwords + hashes
```

## Routes

Storefront: `/` · `/shop` (`?category&size&q&sort&saved`) · `/product/:id` ·
`/checkout` · `/confirmation/:orderNumber`

Admin (guarded): `/admin/login` · `/admin` · `/admin/products` · `/admin/orders` ·
`/admin/reports`

## Mock API

| Method | Path | Access |
|---|---|---|
| GET | `/mock-api/categories`, `/products`, `/products/:id`, `/shipping-zones` | public |
| POST | `/mock-api/orders` (prices, delivery and promo re-computed server-side) | public |
| POST | `/mock-api/visits` | public |
| POST | `/mock-api/auth/login` | public (5 failures → 60 s lock-out) |
| GET | `/mock-api/orders`, `/reports/summary`, `/visits/count` | admin + viewer |
| POST/PUT/DELETE | `/mock-api/products[/:id]`, `/products/:id/images[/:imageId]` | admin only (viewer → 403) |
| PATCH | `/mock-api/orders/:id/status` | admin only (viewer → 403) |

Demo promo code: `LOOM10` (10 % off, validated by the mock API).

## Security notes

- CSP meta tag (same-origin only; `style-src 'unsafe-inline'` is needed by PrimeNG theming).
  Send `frame-ancestors`, HSTS and `X-Content-Type-Options` as real headers when hosting.
- The auth token is attached only to `/mock-api/...` requests.
- Sessions expire (`environment.sessionMinutes`) and carry a role; the guard validates both.
- Images render only from `assets/` or same-origin `blob:` URLs; uploads limited to PNG/JPEG/WebP ≤ 2 MB.
- Production builds have source maps disabled.
