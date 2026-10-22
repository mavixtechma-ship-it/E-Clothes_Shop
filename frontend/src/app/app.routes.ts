import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // ---- Storefront ----
  {
    path: '',
    loadComponent: () => import('./store/store-shell.component').then((m) => m.StoreShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./store/home.page').then((m) => m.HomePage),
        title: 'Loomline — Menswear, woven well',
      },
      {
        path: 'shop',
        loadComponent: () => import('./store/shop.page').then((m) => m.ShopPage),
        title: 'Shop — Loomline',
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./store/product.page').then((m) => m.ProductPage),
        title: 'Product — Loomline',
      },
      {
        path: 'checkout',
        loadComponent: () => import('./store/checkout.page').then((m) => m.CheckoutPage),
        title: 'Checkout — Loomline',
      },
      {
        path: 'confirmation/:orderNumber',
        loadComponent: () => import('./store/confirmation.page').then((m) => m.ConfirmationPage),
        title: 'Order placed — Loomline',
      },
      { path: 'cart', redirectTo: 'checkout' },
    ],
  },

  // ---- Admin ----
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./admin/login.page').then((m) => m.LoginPage),
    title: 'Sign in — Loomline Studio',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./admin/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/overview.page').then((m) => m.OverviewPage),
        title: 'Overview — Loomline Studio',
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products.page').then((m) => m.ProductsPage),
        title: 'Products — Loomline Studio',
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/orders.page').then((m) => m.OrdersPage),
        title: 'Orders — Loomline Studio',
      },
      {
        path: 'reports',
        loadComponent: () => import('./admin/reports.page').then((m) => m.ReportsPage),
        title: 'Reports — Loomline Studio',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
