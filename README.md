# Loomline — Menswear Store & Admin

A demo e-commerce system with a customer storefront and an admin back office. It runs fully in the browser on mock data, so no backend is needed.

## What's inside

| Path | What it is |
|---|---|
| `frontend/` | **Loomline**: an Angular 19 + PrimeNG + Tailwind menswear store with an admin area |
| `index2.htm` | **Hearth Kitchen (مطبخ الدار)**: a single-page Arabic (RTL) home-food shop built with Tailwind + DaisyUI |
| `Mohamed E-shop.html` | An earlier prebuilt demo bundle, kept for reference |

### Loomline features
- **Storefront:** hero section, category rail, filterable product grid, product gallery, bag drawer and 3-step checkout.
- **Order pricing:** prices, delivery fees and promo codes are recalculated from the catalogue when an order is placed.
- **Admin:** dashboard, product management with image upload, orders with status workflow, and sales reports with charts and CSV export.
- **Look:** light and dark themes.

### Hearth Kitchen features
- Arabic RTL menu, cart with quantities, and wishlist.
- Orders are sent via a WhatsApp message (demo number).

## Run

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

`index2.htm` can be opened directly in a browser.

## Demo access
The admin area has two roles: `admin` (full access) and `viewer` (read-only). Ask the project owner for the credentials.

> With no backend, the login is a demo access gate rather than production security.

## Tech
Angular 19 · PrimeNG 19 · Tailwind CSS · Chart.js · mock HTTP interceptor with JSON fixtures · Content-Security-Policy · PBKDF2-hashed credentials (WebCrypto)

## Developed by Mavix Tech

![Mavix Tech](docs/mavix-logo.png)

**Systems · Automation · Graduation Projects**

Custom business systems, workflow automation and complete graduation projects. ASP.NET, Angular, SQL Server.

Have an idea? Let's build it. **[Visit the Mavix Tech website](https://mavixtechma-ship-it.github.io/Mavix/)**
