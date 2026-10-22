# E-shop — Project Analysis

This folder holds two independent demo deliverables plus one untouched artefact:

| Path | Deliverable | Stack |
|---|---|---|
| `frontend/` | **Loomline** — menswear storefront + admin studio | Angular 19 standalone, PrimeNG 19, Tailwind 3, in-browser mock backend |
| `index2.htm` | **Hearth Kitchen / مطبخ الدار** — Arabic RTL home-food shop | Single static page, Tailwind CDN + DaisyUI |
| `Mohamed E-shop.html` | Compiled React bundle with no source | **Left untouched** — not edited, not rebranded, not part of either deliverable |

---

## 1. BEFORE — findings

### 1.1 `frontend/` (former menswear brand, Angular 17)

**Architecture**
- Angular 17.3 standalone app, signals, Tailwind 3, no UI kit. Hand-rolled icon set, toast, drawer and a garment SVG illustration component.
- `core/api.service.ts` called a real REST API at `{environment.apiUrl}/api/...`: categories, products (`?category&size&q`), product by id, shipping-zones, orders (POST/GET), `orders/{id}/status` (PATCH), `auth/login`, products POST/PUT/DELETE, product images (multipart POST / DELETE), `reports/summary`, `visits` (POST) and `visits/count`.
- Storefront: marquee, header, footer, cart drawer; pages home / shop / product / cart / checkout / confirmation.
- Admin: login, dashboard, products list, product form with image upload, orders, reports.

**Branding / identity traces**
- The former brand name appeared in `package.json`, the `angular.json` project, `index.html` title/meta, every route title, the README, model comments, storage keys, the WhatsApp greeting and the placeholder promo code.
- A raster brand logo in `src/assets/` and a wine/cream/blush brand palette.
- An old build-spec markdown in the E-shop root describing the brand.
- `frontend/.git` — a nested repository whose log contained the old brand and a corporate author e-mail.

**Hostnames / contacts**
- `environment.ts`: a localhost HTTPS dev-port API URL and a real-looking WhatsApp phone number.
- `environment.prod.ts`: a cloud App Service placeholder hostname and **no `whatsapp` key** → the production build failed to compile.
- `vercel.json` deploy config bound to the old output folder.

**Security findings**
| Severity | Location | Issue |
|---|---|---|
| High | `auth.interceptor.ts` — `req.url.includes('/api/')` | Bearer token attached to *any* URL containing `/api/` (token leak to third-party hosts). |
| High | `auth.guard.ts` — `if (auth.isAdmin()) return true;` | Guard only checked that *some* token string existed in sessionStorage; no expiry, no role. |
| Medium | `auth.service.ts` | Token in sessionStorage with no expiry; no roles; no read-only account. |
| Medium | Checkout | Promo code and totals only handled client-side. |
| Medium | `angular.json` production | Source maps not explicitly disabled. |
| Low | `utils.ts` `resolveImageUrl` | Arbitrary relative/absolute URLs rendered as images. |
| Info | Angular 17 | Out of support; CLI 17 does not run on Node 24. |

### 1.2 `index2.htm` (former Arabic home-food page)

- Bootstrap 5.3.0 + Bootstrap Icons from jsDelivr, **no SRI**, no CSP.
- Logo was a local social-media JPEG export (already removed → broken image).
- WhatsApp link with an Egyptian-format phone number.
- Six product photos hot-linked from a third-party stock-image CDN (tracking + availability risk).
- Products, cart and wishlist rendered with `innerHTML` **string concatenation** of data — DOM-XSS pattern; inline `onclick` handlers everywhere (blocks a strict CSP).
- Checkout used `alert()`; no quantities in the cart; clicking the overlay toggled *both* drawers (bug: opened the closed one).

---

## 2. Transformation (AFTER)

### 2.1 Loomline (`frontend/`)

**Platform**
- Upgraded to Angular **19.2** (`@angular/*` ^19.2, TypeScript ~5.6, zone.js ~0.15), PrimeNG **19.1** + `@primeng/themes`, PrimeIcons 7, Chart.js 4, Tailwind 3.4. Fonts self-hosted via `@fontsource-variable/manrope` and `fraunces` (no Google Fonts call).
- `npm run build` (production) succeeds; output `dist/loomline/browser`. Source maps off, `inlineCritical` off (no inline `onload` handler, keeps CSP strict), output hashing on.

**Identity**
- New name **Loomline**, new inline-SVG woven-"L" logo (`shared/logo.component.ts`) and `src/favicon.svg`.
- New PrimeNG preset `theme/loomline-preset.ts`: deep-navy primary on warm-sand surfaces, separate ink-navy dark scheme. All app colours come from CSS tokens in `styles.css` (light + `.app-dark`).
- Old logo, spec, `vercel.json`, nested `.git` history and every brand string removed. README rewritten. No WhatsApp button at all (removed rather than pointing at a number).

**Mock backend** — `core/mock/mock-backend.interceptor.ts` (`HttpInterceptorFn`, prefix `/mock-api`)
- Seeds from `src/assets/mock/*.json`: 6 categories, 30 products (sizes, stock, `colorHex`, 2 local SVG images each in `src/assets/products/`), 15 delivery zones, 40 orders with fictional customers (`@example.com`, `555-01xx` phones), 30 days of visits. Regenerate with `node scripts/gen-mock.mjs`.
- Serves every `ApiService` endpoint; writes (orders, products, images, status) are in memory.
- `POST /orders` re-validates the payload and **re-computes** line prices, delivery fee and promo discount from the catalogue (verified: a cart tampered to price 1 was charged the real price), checks/decrements stock.
- Reports (`/reports/summary`) are computed from the data: revenue, AOV, revenue by category/day, best sellers, low stock, status mix.
- 401 for admin reads without a session; **403 for any write by `viewer`**; public order placement and visit tracking stay open. Login lock-out after 5 failures (60 s).

**Auth**
- Exactly two accounts, `admin` and `viewer`. Random 14-char passwords generated with Node `crypto` (`scripts/gen-credentials.mjs`, `npm run hash-passwords`). Only salted **PBKDF2-SHA256, 310 000 iterations** hashes stored in `core/auth/credentials.config.ts`; verification with WebCrypto + constant-time compare, dummy derivation for unknown users.
- Session `{ token (256-bit random), username, role, expiresAt }` in sessionStorage; shape + expiry validated on restore; auto-logout timer; guard checks validity and role.
- Interceptor attaches the token **only** to `/mock-api/...`; a 401 ends the session.
- Viewer sees every admin page read-only (no New/Edit/Delete/Upload/Status controls, “Read-only” tag in the top bar) — and the mock API enforces it independently.
- Plaintext credentials only in `E-shop/CREDENTIALS.md` (git-ignored via `E-shop/.gitignore`).

**UI (100 % new)**
- Storefront: announcement bar, sticky header with search/theme/wishlist/bag, split hero with product collage, horizontally scrolling category rail, `p-dataview` grids (grid/list toggle, sort, paginator, filters synced to the URL), product page with `p-galleria` + size picker + accordion, bag `p-drawer`, three-step `p-stepper` checkout (bag → delivery form → review/promo), confirmation with server-computed totals.
- Admin studio (per the portal-dashboard guidance — one job per page, mixed widget types, shared components): sidebar shell + top bar with dark/light toggle and role badge; Overview (4 KPIs, revenue trend line, low-stock list, recent orders table, status donut); Products (`p-table` with filters/sort/paging, `p-dialog` form, `p-fileupload` limited to PNG/JPEG/WebP ≤ 2 MB, confirm dialog for delete); Orders (filter bar, table, detail `p-drawer` with status change); Reports (KPIs, horizontal bar by category, best sellers, visits chart, CSV export with formula-injection guard).

**Security measures**
- CSP meta: same-origin only (`script-src 'self'`; `style-src 'unsafe-inline'` required by PrimeNG runtime theming; `img-src 'self' blob: data:`). `frame-ancestors`, HSTS, `nosniff` must be sent as HTTP headers by the host.
- No `innerHTML`/`bypassSecurityTrust*`; all data through Angular bindings. Images only from `assets/` or same-origin `blob:` URLs.
- Route params validated, query values length-capped, path segments `encodeURIComponent`-ed, stored cart/wishlist JSON validated on load.
- Note: there is no server here, so *all* enforcement (prices, roles, validation) lives in the mock interceptor inside the bundle and is bypassable. A real deployment must re-implement it server-side.

### 2.2 Hearth Kitchen / مطبخ الدار (`index2.htm`)

- Rebuilt from scratch: RTL Arabic, Tailwind Play CDN **3.4.16** (pinned) + DaisyUI **4.12.14** (`dist/full.css`, pinned **with SRI**), Readex Pro from Google Fonts. Deep-green / saffron / cream palette layered on DaisyUI variables; inline-SVG logo, favicon and hero illustration; emoji food tiles instead of remote photos (zero image requests).
- Sections: header (cart + wishlist with badges), hero, demo-disclaimer notice, category tabs, menu grid, “how to order” steps, footer without contacts. Cart drawer with quantities, name/area fields and total; separate wishlist panel; focus handling, `Esc` to close, overlay closes only the open panel (old bug fixed); toasts instead of `alert()`.
- All rendering via `createElement` + `textContent`; **no `innerHTML`**, no inline event handlers. Cart/wishlist persisted in localStorage and validated against the product list on load.
- “Order via WhatsApp” builds the message with `encodeURIComponent` and opens `https://wa.me/000000000000` — an obviously fake placeholder, labelled “رقم تجريبي”.
- CSP meta: `default-src 'none'`, scripts only from the pinned Tailwind CDN plus the two inline scripts by **sha256 hash**, `connect-src 'none'`, `base-uri`/`form-action`/`object-src` locked. Limitation: the Tailwind CDN sends no CORS header, so SRI cannot be applied to it; it also needs `style-src 'unsafe-inline'`. For production, compile Tailwind instead of using the Play CDN.

### 2.3 Verification

- `npm run build` in `frontend/` — success (Angular 19.2, production config).
- Headless Chrome smoke test against the production build: storefront pages render; checkout completes and the server-side recompute applied (promo `LOOM10`, delivery fee); `admin` login reaches all four admin pages with edit controls; `viewer` login sees read-only pages (tested in dark mode). Both stored hashes verified against `CREDENTIALS.md`.
- `index2.htm` tested at 390 px: no horizontal overflow, CSP hashes valid (scripts execute), WhatsApp link uses the placeholder number.
- Trace grep over E-shop (excluding `node_modules`, `dist`, `.angular`, `Mohamed E-shop.html`) for former-employer names, the old brand, old ports/hosts, phone prefixes, the old image file name and the stock-photo host — **no hits**.
