import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Category, Product } from '../core/models';
import { WishlistService } from '../core/wishlist.service';
import { ProductTileComponent } from '../shared/product-tile.component';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'newest';

@Component({
  selector: 'app-shop-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    DataViewModule,
    SelectModule,
    SelectButtonModule,
    SkeletonModule,
    ChipModule,
    ProductTileComponent,
  ],
  template: `
    <section class="mx-auto max-w-content px-4 pt-10">
      <p class="eyebrow">{{ saved() ? 'Your list' : 'Catalogue' }}</p>
      <h1 class="mt-1 font-display text-4xl font-semibold">{{ heading() }}</h1>
    </section>

    <div class="mx-auto mt-8 grid max-w-content gap-8 px-4 lg:grid-cols-[14rem_1fr]">
      <!-- Filters -->
      <aside class="space-y-8" aria-label="Filters">
        <div>
          <h2 class="eyebrow mb-3">Category</h2>
          <ul class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            <li>
              <button type="button" class="w-full rounded-lg px-3 py-1.5 text-left text-sm font-semibold transition"
                [class]="!category() ? 'bg-brand text-on-brand' : 'hover:bg-surface-2'" (click)="setParam('category', null)">
                All
              </button>
            </li>
            @for (c of categories(); track c.id) {
              <li>
                <button type="button" class="flex w-full justify-between rounded-lg px-3 py-1.5 text-left text-sm font-semibold transition"
                  [class]="category() === c.name ? 'bg-brand text-on-brand' : 'hover:bg-surface-2'"
                  [attr.aria-pressed]="category() === c.name" (click)="setParam('category', c.name)">
                  <span>{{ c.name }}</span><span class="num opacity-60">{{ c.count }}</span>
                </button>
              </li>
            }
          </ul>
        </div>
        <div>
          <h2 class="eyebrow mb-3">Size</h2>
          <div class="flex flex-wrap gap-1.5">
            @for (s of sizes; track s) {
              <button type="button" class="h-9 min-w-9 rounded-md border px-2 text-sm font-semibold transition"
                [class]="size() === s ? 'border-[var(--ll-brand)] bg-brand text-on-brand' : 'border-line hover:border-[var(--ll-brand)]'"
                [attr.aria-pressed]="size() === s" (click)="setParam('size', size() === s ? null : s)">
                {{ s }}
              </button>
            }
          </div>
        </div>
        <p-button
          [label]="saved() ? 'Show everything' : 'Saved only (' + wishlist.count() + ')'"
          [icon]="saved() ? 'pi pi-th-large' : 'pi pi-heart'"
          severity="secondary"
          [outlined]="true"
          size="small"
          (onClick)="setParam('saved', saved() ? null : '1')"
        />
      </aside>

      <!-- Results -->
      <div>
        <p-dataview
          [value]="visible()"
          [layout]="layout()"
          [paginator]="visible().length > 12"
          [rows]="12"
          [alwaysShowPaginator]="false"
          emptyMessage=" "
        >
          <ng-template #header>
            <div class="flex flex-wrap items-center gap-3">
              <span class="num text-sm text-muted">{{ loading() ? 'Loading…' : visible().length + ' pieces' }}</span>
              @if (q()) {
                <p-chip [label]="'“' + q() + '”'" [removable]="true" (onRemove)="setParam('q', null)" />
              }
              <div class="ml-auto flex items-center gap-2">
                <p-select
                  [options]="sortOptions"
                  [ngModel]="sort()"
                  (ngModelChange)="setParam('sort', $event === 'featured' ? null : $event)"
                  optionLabel="label"
                  optionValue="value"
                  ariaLabel="Sort products"
                  size="small"
                />
                <p-selectbutton
                  [options]="layoutOptions"
                  [ngModel]="layout()"
                  (ngModelChange)="layout.set($event ?? 'grid')"
                  optionValue="value"
                  [allowEmpty]="false"
                  ariaLabelledBy="layout"
                  size="small"
                >
                  <ng-template #item let-o><i [class]="o.icon" [attr.aria-label]="o.label"></i></ng-template>
                </p-selectbutton>
              </div>
            </div>
          </ng-template>

          <ng-template #grid let-items>
            <div class="ll-grid pt-4">
              @for (p of items; track p.id) {
                <app-product-tile [product]="p" />
              }
            </div>
          </ng-template>

          <ng-template #list let-items>
            <div class="divide-y divide-[var(--ll-border)] pt-2">
              @for (p of items; track p.id) {
                <div class="py-4"><app-product-tile [product]="p" [list]="true" /></div>
              }
            </div>
          </ng-template>

          <ng-template #emptymessage>
            @if (loading()) {
              <div class="ll-grid pt-4">
                @for (s of [1, 2, 3, 4, 5, 6]; track s) {
                  <p-skeleton height="22rem" borderRadius="12px" />
                }
              </div>
            } @else {
              <div class="py-16 text-center">
                <i class="pi pi-search text-3xl text-muted" aria-hidden="true"></i>
                <p class="mt-3 text-muted">Nothing matches those filters.</p>
                <p-button label="Clear filters" [text]="true" (onClick)="clearAll()" />
              </div>
            }
          </ng-template>
        </p-dataview>
      </div>
    </div>
  `,
})
export class ShopPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected wishlist = inject(WishlistService);

  private params = toSignal(this.route.queryParamMap, { requireSync: true });
  category = computed(() => this.params().get('category'));
  size = computed(() => this.params().get('size'));
  q = computed(() => (this.params().get('q') ?? '').slice(0, 60));
  saved = computed(() => this.params().get('saved') === '1');
  sort = computed<Sort>(() => {
    const s = this.params().get('sort');
    return s === 'price-asc' || s === 'price-desc' || s === 'newest' ? s : 'featured';
  });

  layout = signal<'grid' | 'list'>('grid');
  sizes = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38'];
  sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price: low to high', value: 'price-asc' },
    { label: 'Price: high to low', value: 'price-desc' },
  ];
  layoutOptions = [
    { icon: 'pi pi-th-large', label: 'Grid view', value: 'grid' },
    { icon: 'pi pi-list', label: 'List view', value: 'list' },
  ];

  categories = toSignal(this.api.getCategories().pipe(catchError(() => of([] as Category[]))), {
    initialValue: [] as Category[],
  });

  private result = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((p) =>
        this.api
          .getProducts({
            category: p.get('category') ?? undefined,
            size: p.get('size') ?? undefined,
            search: (p.get('q') ?? '').slice(0, 60) || undefined,
          })
          .pipe(
            map((items) => ({ loading: false, items })),
            catchError(() => of({ loading: false, items: [] as Product[] })),
            startWith({ loading: true, items: [] as Product[] }),
          ),
      ),
    ),
    { initialValue: { loading: true, items: [] as Product[] } },
  );

  loading = computed(() => this.result().loading);
  visible = computed(() => {
    let items = [...this.result().items];
    if (this.saved()) items = items.filter((p) => this.wishlist.ids().has(p.id));
    switch (this.sort()) {
      case 'price-asc':
        return items.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return items.sort((a, b) => b.price - a.price);
      case 'newest':
        return items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      default:
        return items.sort((a, b) => Number(b.featured) - Number(a.featured) || a.id - b.id);
    }
  });

  heading = computed(() => {
    if (this.saved()) return 'Saved pieces';
    if (this.q()) return `Results for “${this.q()}”`;
    return this.category() ?? 'Everything';
  });

  setParam(key: string, value: string | null): void {
    this.router.navigate([], { queryParams: { [key]: value }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  clearAll(): void {
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
