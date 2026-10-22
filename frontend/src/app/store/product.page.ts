import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Product } from '../core/models';
import { CartService } from '../core/cart.service';
import { safeImageUrl } from '../core/utils';
import { WishlistService } from '../core/wishlist.service';
import { EgpPipe } from '../shared/egp.pipe';
import { ProductTileComponent } from '../shared/product-tile.component';

type State = { status: 'loading' | 'ready' | 'missing'; product: Product | null };

@Component({
  selector: 'app-product-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PrimeTemplate,
    AccordionModule,
    ButtonModule,
    GalleriaModule,
    InputNumberModule,
    SkeletonModule,
    TagModule,
    EgpPipe,
    ProductTileComponent,
  ],
  template: `
    @switch (state().status) {
      @case ('loading') {
        <div class="mx-auto grid max-w-content gap-10 px-4 py-10 md:grid-cols-2">
          <p-skeleton height="36rem" borderRadius="16px" />
          <div class="space-y-4">
            <p-skeleton width="40%" /><p-skeleton height="3rem" /><p-skeleton width="30%" /><p-skeleton height="8rem" />
          </div>
        </div>
      }
      @case ('missing') {
        <div class="mx-auto max-w-content px-4 py-24 text-center">
          <h1 class="font-display text-3xl">This piece has left the rail.</h1>
          <p class="mt-2 text-muted">It may have sold out or been removed.</p>
          <p-button label="Back to the shop" routerLink="/shop" styleClass="mt-6" />
        </div>
      }
      @case ('ready') {
        @if (state().product; as p) {
          <nav class="mx-auto max-w-content px-4 pt-6 text-sm text-muted" aria-label="Breadcrumb">
            <a routerLink="/shop" class="ll-link">Shop</a> /
            <a routerLink="/shop" [queryParams]="{ category: p.category }" class="ll-link">{{ p.category }}</a> /
            <span class="text-ink">{{ p.name }}</span>
          </nav>

          <div class="mx-auto grid max-w-content gap-10 px-4 py-8 md:grid-cols-12">
            <div class="md:col-span-7">
              <p-galleria
                [value]="images()"
                [numVisible]="4"
                [showItemNavigators]="images().length > 1"
                [showThumbnails]="images().length > 1"
                thumbnailsPosition="left"
                [responsiveOptions]="galleriaResponsive"
                [circular]="true"
                containerClass="ll-galleria"
              >
                <ng-template pTemplate="item" let-item>
                  <div class="ll-frame w-full"><img [src]="item.src" [alt]="item.alt" /></div>
                </ng-template>
                <ng-template pTemplate="thumbnail" let-item>
                  <img [src]="item.src" [alt]="''" class="h-20 w-16 rounded-md object-cover" />
                </ng-template>
              </p-galleria>
            </div>

            <div class="md:col-span-5">
              <p class="eyebrow">{{ p.category }}</p>
              <h1 class="mt-2 font-display text-4xl font-semibold leading-tight">{{ p.name }}</h1>
              <p class="num mt-3 text-2xl font-semibold">{{ p.price | egp }}</p>

              <div class="mt-6 flex items-center gap-3 text-sm">
                <span class="h-6 w-6 rounded-full ring-2 ring-[var(--ll-border)]" [style.background]="p.colorHex" aria-hidden="true"></span>
                <span><span class="mr-1 text-muted">Colour</span><strong>{{ p.colorName }}</strong></span>
                @if (p.stock === 0) {
                  <p-tag value="Sold out" severity="secondary" />
                } @else if (p.stock <= 5) {
                  <p-tag [value]="'Only ' + p.stock + ' left'" severity="warn" />
                } @else {
                  <p-tag value="In stock" severity="success" />
                }
              </div>

              <fieldset class="mt-6">
                <legend class="eyebrow mb-2">Size</legend>
                <div class="flex flex-wrap gap-2">
                  @for (s of p.sizes; track s) {
                    <button type="button" class="h-11 min-w-12 rounded-lg border px-3 text-sm font-semibold transition"
                      [class]="size() === s ? 'border-[var(--ll-brand)] bg-brand text-on-brand' : 'border-line hover:border-[var(--ll-brand)]'"
                      [attr.aria-pressed]="size() === s" (click)="size.set(s)">
                      {{ s }}
                    </button>
                  }
                </div>
              </fieldset>

              <div class="mt-6 flex flex-wrap items-center gap-3">
                <p-inputnumber [(ngModel)]="qty" [showButtons]="true" buttonLayout="horizontal" [min]="1" [max]="10"
                  inputStyleClass="!w-12 text-center" decrementButtonIcon="pi pi-minus" incrementButtonIcon="pi pi-plus" ariaLabel="Quantity" />
                <p-button
                  [label]="p.stock === 0 ? 'Sold out' : size() ? 'Add to bag' : 'Choose a size'"
                  icon="pi pi-shopping-bag"
                  size="large"
                  [disabled]="p.stock === 0 || !size()"
                  styleClass="flex-1"
                  (onClick)="add(p)"
                />
                <p-button
                  [icon]="saved() ? 'pi pi-heart-fill' : 'pi pi-heart'"
                  severity="secondary"
                  [outlined]="true"
                  size="large"
                  [ariaLabel]="saved() ? 'Remove from wishlist' : 'Save to wishlist'"
                  (onClick)="wishlist.toggle(p.id)"
                />
              </div>

              <p-accordion [value]="['0']" [multiple]="true" styleClass="mt-8">
                <p-accordion-panel value="0">
                  <p-accordion-header>Details</p-accordion-header>
                  <p-accordion-content>
                    <p class="text-sm leading-relaxed text-muted">{{ p.description }}</p>
                  </p-accordion-content>
                </p-accordion-panel>
                <p-accordion-panel value="1">
                  <p-accordion-header>Fabric &amp; care</p-accordion-header>
                  <p-accordion-content>
                    <p class="text-sm text-muted">{{ p.material }}. Cool wash, dry flat, warm iron on the reverse.</p>
                  </p-accordion-content>
                </p-accordion-panel>
                <p-accordion-panel value="2">
                  <p-accordion-header>Delivery &amp; returns</p-accordion-header>
                  <p-accordion-content>
                    <p class="text-sm text-muted">Flat fee per delivery area, shown at checkout. Free returns within 30 days.</p>
                  </p-accordion-content>
                </p-accordion-panel>
              </p-accordion>
            </div>
          </div>

          @if (related().length) {
            <section class="mx-auto max-w-content px-4 pt-8" aria-labelledby="rel-h">
              <h2 id="rel-h" class="mb-5 font-display text-2xl font-semibold">More {{ p.category.toLowerCase() }}</h2>
              <div class="ll-grid">
                @for (r of related(); track r.id) {
                  <app-product-tile [product]="r" />
                }
              </div>
            </section>
          }
        }
      }
    }
  `,
})
export class ProductPage {
  /** Route param bound via withComponentInputBinding(). */
  id = input.required<string>();

  private api = inject(ApiService);
  private cart = inject(CartService);
  private toast = inject(MessageService);
  private title = inject(Title);
  protected wishlist = inject(WishlistService);

  size = signal<string | null>(null);
  qty = 1;

  galleriaResponsive = [{ breakpoint: '768px', numVisible: 3 }];

  state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        /^\d{1,9}$/.test(id)
          ? this.api.getProduct(id).pipe(
              map((product): State => ({ status: 'ready', product })),
              catchError(() => of<State>({ status: 'missing', product: null })),
              startWith<State>({ status: 'loading', product: null }),
            )
          : of<State>({ status: 'missing', product: null }),
      ),
    ),
    { initialValue: { status: 'loading', product: null } as State },
  );

  private all = toSignal(this.api.getProducts().pipe(catchError(() => of([] as Product[]))), {
    initialValue: [] as Product[],
  });

  images = computed(() => {
    const p = this.state().product;
    if (!p) return [];
    return p.images
      .map((img, i) => ({ src: safeImageUrl(img.url), alt: `${p.name} — view ${i + 1}` }))
      .filter((i): i is { src: string; alt: string } => !!i.src);
  });

  related = computed(() => {
    const p = this.state().product;
    return p ? this.all().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4) : [];
  });

  saved = computed(() => {
    const p = this.state().product;
    return !!p && this.wishlist.ids().has(p.id);
  });

  constructor() {
    effect(() => {
      const p = this.state().product;
      this.size.set(null);
      this.qty = 1;
      if (p) this.title.setTitle(`${p.name} — Loomline`);
    });
  }

  add(p: Product): void {
    const s = this.size();
    if (!s) return;
    this.cart.add(p, s, this.qty);
    this.toast.add({ severity: 'success', summary: 'Added to bag', detail: `${p.name} · ${s}`, life: 2500 });
    this.cart.drawerOpen.set(true);
  }
}
