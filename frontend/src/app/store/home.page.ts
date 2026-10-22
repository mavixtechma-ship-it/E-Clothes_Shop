import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { SkeletonModule } from 'primeng/skeleton';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Category, Product } from '../core/models';
import { ProductImageComponent } from '../shared/product-image.component';
import { ProductTileComponent } from '../shared/product-tile.component';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule, DataViewModule, SkeletonModule, ProductImageComponent, ProductTileComponent],
  template: `
    <!-- Hero -->
    <section class="mx-auto grid max-w-content items-center gap-10 px-4 pb-12 pt-10 md:grid-cols-12 md:pt-16">
      <div class="md:col-span-6">
        <p class="eyebrow">Autumn / Winter edit</p>
        <h1 class="mt-3 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-6xl">
          Menswear,<br />woven <em class="font-normal">well.</em>
        </h1>
        <p class="mt-5 max-w-md text-lg text-muted">
          Thirty pieces in honest fabrics — lambswool, selvedge, waxed cotton — cut to be worn hard and kept for years.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <p-button label="Shop the edit" icon="pi pi-arrow-right" iconPos="right" size="large" routerLink="/shop" />
          <p-button label="Outerwear" severity="secondary" [outlined]="true" size="large" routerLink="/shop" [queryParams]="{ category: 'Outerwear' }" />
        </div>
        <dl class="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
          <div><dt class="text-muted">Fabrics</dt><dd class="font-semibold">12 mills</dd></div>
          <div><dt class="text-muted">Delivery</dt><dd class="font-semibold">15 areas</dd></div>
          <div><dt class="text-muted">Returns</dt><dd class="font-semibold">30 days</dd></div>
        </dl>
      </div>

      <div class="relative md:col-span-6">
        <div class="grid grid-cols-5 grid-rows-6 gap-3" style="height: min(34rem, 80vw)">
          @if (heroItems(); as items) {
            @for (p of items; track p.id; let i = $index) {
              <a
                [routerLink]="['/product', p.id]"
                [class]="heroClass[i]"
                class="overflow-hidden rounded-2xl ring-1 ring-[var(--ll-border)]"
                [attr.aria-label]="p.name"
              >
                <app-product-image class="h-full [&_.ll-frame]:h-full [&_.ll-frame]:aspect-auto" [url]="p.images.at(0)?.url" [alt]="p.name" />
              </a>
            }
          }
        </div>
      </div>
    </section>

    <!-- Category rail -->
    <section class="border-y border-line bg-surface-2" aria-labelledby="cat-h">
      <div class="mx-auto max-w-content px-4 py-10">
        <div class="mb-5 flex items-end justify-between">
          <h2 id="cat-h" class="font-display text-2xl font-semibold">Shop by category</h2>
          <a routerLink="/shop" class="ll-link text-sm font-semibold">View all →</a>
        </div>
        <div class="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          @for (c of categories(); track c.id) {
            <a
              routerLink="/shop"
              [queryParams]="{ category: c.name }"
              class="group min-w-[13rem] snap-start rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span class="num text-xs font-semibold text-muted">{{ c.count }} pieces</span>
              <span class="mt-6 block font-display text-xl font-semibold text-ink">{{ c.name }}</span>
              <span class="mt-1 block text-sm text-muted">{{ c.blurb }}</span>
              <i class="pi pi-arrow-right mt-4 text-brand transition group-hover:translate-x-1" aria-hidden="true"></i>
            </a>
          } @empty {
            @for (s of [1, 2, 3, 4]; track s) {
              <p-skeleton width="13rem" height="9rem" borderRadius="1rem" />
            }
          }
        </div>
      </div>
    </section>

    <!-- Featured -->
    <section class="mx-auto max-w-content px-4 py-14" aria-labelledby="feat-h">
      <div class="mb-6 flex items-end justify-between">
        <div>
          <p class="eyebrow">Staff picks</p>
          <h2 id="feat-h" class="mt-1 font-display text-3xl font-semibold">The foundations</h2>
        </div>
        <p-button label="Everything" [text]="true" icon="pi pi-arrow-right" iconPos="right" routerLink="/shop" />
      </div>
      <p-dataview [value]="featured()" layout="grid" [rows]="8" emptyMessage="Loading the edit…">
        <ng-template #grid let-items>
          <div class="ll-grid">
            @for (p of items; track p.id) {
              <app-product-tile [product]="p" />
            }
          </div>
        </ng-template>
      </p-dataview>
    </section>

    <!-- Promise -->
    <section class="mx-auto max-w-content px-4">
      <div class="grid gap-px overflow-hidden rounded-2xl border border-line bg-[var(--ll-border)] md:grid-cols-3">
        @for (v of values; track v.title) {
          <div class="bg-surface p-6">
            <i [class]="v.icon + ' text-xl text-brand'" aria-hidden="true"></i>
            <h3 class="mt-3 font-semibold">{{ v.title }}</h3>
            <p class="mt-1 text-sm text-muted">{{ v.text }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class HomePage {
  private api = inject(ApiService);

  private products = toSignal(this.api.getProducts().pipe(catchError(() => of([] as Product[]))), {
    initialValue: [] as Product[],
  });
  categories = toSignal(this.api.getCategories().pipe(catchError(() => of([] as Category[]))), {
    initialValue: [] as Category[],
  });

  featured = computed(() => this.products().filter((p) => p.featured));
  heroItems = computed(() => {
    const f = this.featured();
    return f.length >= 3 ? [f[7] ?? f[0], f[0], f[3] ?? f[1]] : null;
  });
  heroClass = ['col-span-3 row-span-6', 'col-span-2 row-span-3', 'col-span-2 row-span-3'];

  values = [
    { icon: 'pi pi-box', title: 'Honest fabrics', text: 'Every product page lists the cloth and its weight — no vague blends.' },
    { icon: 'pi pi-sync', title: '30-day returns', text: 'Wear it at home, keep the tags on, send it back if it is not right.' },
    { icon: 'pi pi-truck', title: 'Flat delivery fees', text: 'One fee per area, shown before you pay. No surprises at the door.' },
  ];
}
