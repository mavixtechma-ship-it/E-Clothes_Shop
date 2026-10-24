import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { InputNumberModule } from 'primeng/inputnumber';
import { CartService } from '../core/cart.service';
import { OWNER } from '../core/owner';
import { ThemeService } from '../core/theme.service';
import { WishlistService } from '../core/wishlist.service';
import { AboutDialogComponent } from '../shared/about-dialog.component';
import { EgpPipe } from '../shared/egp.pipe';
import { LogoComponent } from '../shared/logo.component';
import { ProductImageComponent } from '../shared/product-image.component';

@Component({
  selector: 'app-store-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ButtonModule,
    DrawerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    OverlayBadgeModule,
    InputNumberModule,
    EgpPipe,
    LogoComponent,
    ProductImageComponent,
    AboutDialogComponent,
  ],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
      Skip to content
    </a>

    <div class="bg-brand text-on-brand">
      <p class="mx-auto max-w-content px-4 py-2 text-center text-xs font-medium tracking-wide">
        Free alterations on every order · Demo store with mock data — nothing is charged or shipped
      </p>
    </div>

    <header class="sticky top-0 z-30 border-b border-line bg-bg">
      <div class="mx-auto flex max-w-content items-center gap-4 px-4 py-3">
        <a routerLink="/" aria-label="Loomline home"><app-logo /></a>

        <nav class="ml-4 hidden items-center gap-5 text-sm font-semibold md:flex" aria-label="Primary">
          <a routerLink="/shop" routerLinkActive="text-brand" [routerLinkActiveOptions]="{ exact: true }" class="ll-link">Shop all</a>
          <a routerLink="/shop" [queryParams]="{ category: 'Knitwear' }" class="ll-link">Knitwear</a>
          <a routerLink="/shop" [queryParams]="{ category: 'Outerwear' }" class="ll-link">Outerwear</a>
          <a routerLink="/shop" [queryParams]="{ category: 'Denim' }" class="ll-link">Denim</a>
        </nav>

        <form class="ml-auto hidden flex-1 justify-end lg:flex" role="search" (ngSubmit)="search()">
          <p-iconfield class="w-full max-w-xs">
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="search"
              name="q"
              [(ngModel)]="query"
              maxlength="60"
              placeholder="Search oxford, merino, selvedge…"
              aria-label="Search products"
              class="w-full"
            />
          </p-iconfield>
        </form>

        <div class="ml-auto flex items-center gap-1 lg:ml-2">
          <p-button
            [icon]="theme.theme() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [ariaLabel]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            (onClick)="theme.toggle()"
          />
          <p-button
            routerLink="/shop"
            [queryParams]="{ saved: 1 }"
            icon="pi pi-heart"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [badge]="wishlist.count() ? '' + wishlist.count() : ''"
            ariaLabel="Saved items"
          />
          <p-button
            icon="pi pi-shopping-bag"
            [rounded]="true"
            [badge]="cart.count() ? '' + cart.count() : ''"
            badgeSeverity="contrast"
            ariaLabel="Open bag"
            (onClick)="cart.drawerOpen.set(true)"
          />
          <p-button
            icon="pi pi-bars"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            styleClass="md:!hidden"
            ariaLabel="Open menu"
            (onClick)="menuOpen.set(true)"
          />
        </div>
      </div>
    </header>

    <main id="main" class="min-h-[60vh]">
      <router-outlet />
    </main>

    <footer class="mt-20 border-t border-line bg-surface-2">
      <div class="ll-weave"></div>
      <div class="mx-auto grid max-w-content gap-10 px-4 py-12 md:grid-cols-4">
        <div class="md:col-span-2">
          <app-logo />
          <p class="mt-4 max-w-sm text-sm text-muted">
            Everyday menswear in honest fabrics. Loomline is a portfolio demo — the catalogue, orders and customers are fictional.
          </p>
        </div>
        <div>
          <h2 class="eyebrow mb-3">Shop</h2>
          <ul class="space-y-2 text-sm">
            @for (c of footerCats; track c) {
              <li><a class="ll-link" routerLink="/shop" [queryParams]="{ category: c }">{{ c }}</a></li>
            }
          </ul>
        </div>
        <div>
          <h2 class="eyebrow mb-3">Studio</h2>
          <ul class="space-y-2 text-sm">
            <li><a class="ll-link" routerLink="/admin">Admin studio</a></li>
            <li><a class="ll-link" routerLink="/checkout">Your bag</a></li>
          </ul>
        </div>
      </div>
      <div class="mx-auto max-w-content px-4 pb-8">
        <div class="mvx flex flex-col items-center gap-3 rounded-xl px-4 py-3 text-center sm:flex-row sm:text-left">
          <img [src]="mavixLogo()" [alt]="owner.name" width="98" height="32" class="h-7 w-auto" />
          <p class="text-sm">
            Developed by <span class="font-bold">{{ owner.name }}</span>
            <span class="mvx-accent hidden text-xs font-semibold md:inline"> · {{ owner.tagline }}</span>
          </p>
          <div class="flex items-center gap-4 text-sm sm:ml-auto">
            <button type="button" class="mvx-link cursor-pointer bg-transparent p-0" (click)="aboutOpen.set(true)">About</button>
            <a [href]="owner.url" target="_blank" rel="noopener noreferrer" class="mvx-link">
              Visit website <i class="pi pi-external-link text-xs" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
      <p class="pb-8 text-center text-xs text-muted">© {{ year }} Loomline (demo). No real payments or deliveries.</p>
    </footer>

    <!-- Mobile menu -->
    <p-drawer [visible]="menuOpen()" (visibleChange)="menuOpen.set($event)" position="left" header="Menu" [style]="{ width: '18rem' }">
      <nav class="flex flex-col gap-3 text-base font-semibold" aria-label="Mobile">
        <a routerLink="/shop" (click)="menuOpen.set(false)">Shop all</a>
        @for (c of footerCats; track c) {
          <a routerLink="/shop" [queryParams]="{ category: c }" (click)="menuOpen.set(false)">{{ c }}</a>
        }
        <a routerLink="/admin" (click)="menuOpen.set(false)" class="mt-4 text-muted">Admin studio</a>
      </nav>
    </p-drawer>

    <!-- Bag -->
    <p-drawer
      [visible]="cart.drawerOpen()"
      (visibleChange)="cart.drawerOpen.set($event)"
      position="right"
      [style]="{ width: 'min(26rem, 100vw)' }"
    >
      <ng-template #header>
        <div class="flex items-baseline gap-2">
          <span class="font-display text-xl font-semibold">Your bag</span>
          <span class="text-sm text-muted">{{ cart.count() }} item{{ cart.count() === 1 ? '' : 's' }}</span>
        </div>
      </ng-template>

      @if (cart.lines().length === 0) {
        <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
          <i class="pi pi-shopping-bag text-4xl text-muted" aria-hidden="true"></i>
          <p class="text-muted">Your bag is empty.</p>
          <p-button label="Browse the shop" routerLink="/shop" (onClick)="cart.drawerOpen.set(false)" />
        </div>
      } @else {
        <ul class="divide-y divide-[var(--ll-border)]">
          @for (l of cart.lines(); track l.productId + '-' + l.size) {
            <li class="flex gap-3 py-4">
              <app-product-image class="w-20 shrink-0" [url]="l.imageUrl" [alt]="l.name" [color]="l.color" />
              <div class="flex flex-1 flex-col">
                <div class="flex justify-between gap-2">
                  <a [routerLink]="['/product', l.productId]" class="font-semibold" (click)="cart.drawerOpen.set(false)">{{ l.name }}</a>
                  <span class="num text-sm font-semibold">{{ l.price * l.qty | egp }}</span>
                </div>
                <span class="text-xs text-muted">Size {{ l.size }} · {{ l.price | egp }} each</span>
                <div class="mt-auto flex items-center justify-between pt-2">
                  <p-inputnumber
                    [ngModel]="l.qty"
                    (ngModelChange)="cart.setQty(l.productId, l.size, $event ?? 0)"
                    [showButtons]="true"
                    buttonLayout="horizontal"
                    [min]="0"
                    [max]="10"
                    inputStyleClass="!w-10 text-center"
                    decrementButtonIcon="pi pi-minus"
                    incrementButtonIcon="pi pi-plus"
                    [ariaLabel]="'Quantity of ' + l.name"
                    size="small"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    severity="secondary"
                    size="small"
                    [ariaLabel]="'Remove ' + l.name"
                    (onClick)="cart.remove(l.productId, l.size)"
                  />
                </div>
              </div>
            </li>
          }
        </ul>
      }

      <ng-template #footer>
        @if (cart.lines().length) {
          <div class="space-y-3 border-t border-line pt-4">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Subtotal</span>
              <span class="num font-semibold">{{ cart.subtotal() | egp }}</span>
            </div>
            <p class="text-xs text-muted">Delivery and promo codes are applied at checkout.</p>
            <p-button label="Checkout" icon="pi pi-arrow-right" iconPos="right" styleClass="w-full" (onClick)="goCheckout()" />
          </div>
        }
      </ng-template>
    </p-drawer>

    <app-about-dialog [(visible)]="aboutOpen" />
  `,
})
export class StoreShellComponent {
  protected cart = inject(CartService);
  protected wishlist = inject(WishlistService);
  protected theme = inject(ThemeService);
  private router = inject(Router);

  menuOpen = signal(false);
  aboutOpen = signal(false);
  protected owner = OWNER;
  protected mavixLogo = computed(() => (this.theme.theme() === 'dark' ? OWNER.logoDark : OWNER.logo));
  query = '';
  year = new Date().getFullYear();
  footerCats = ['Tees', 'Shirts', 'Knitwear', 'Denim', 'Trousers', 'Outerwear'];

  search(): void {
    const q = this.query.trim().slice(0, 60);
    this.router.navigate(['/shop'], { queryParams: q ? { q } : {} });
  }

  goCheckout(): void {
    this.cart.drawerOpen.set(false);
    this.router.navigate(['/checkout']);
  }
}
