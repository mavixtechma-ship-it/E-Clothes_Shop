import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { Product } from '../core/models';
import { WishlistService } from '../core/wishlist.service';
import { EgpPipe } from './egp.pipe';
import { ProductImageComponent } from './product-image.component';

/** Storefront product card used by the home rail and the shop data view. */
@Component({
  selector: 'app-product-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TagModule, EgpPipe, ProductImageComponent],
  template: `
    <article class="ll-lift group relative flex h-full flex-col" [class.flex-row]="list()" [class.gap-4]="list()">
      <a
        [routerLink]="['/product', product().id]"
        class="relative block"
        [class.w-32]="list()"
        [class.shrink-0]="list()"
        [attr.aria-label]="product().name"
      >
        <app-product-image [url]="product().images.at(0)?.url" [alt]="product().name" [color]="product().colorHex" />
        @if (product().stock === 0) {
          <p-tag value="Sold out" severity="secondary" class="absolute left-3 top-3" />
        } @else if (product().stock <= 5) {
          <p-tag [value]="'Only ' + product().stock + ' left'" severity="warn" class="absolute left-3 top-3" />
        }
      </a>
      <button
        type="button"
        class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-sm ring-1 ring-[var(--ll-border)] transition hover:scale-105"
        [class.hidden]="list()"
        [attr.aria-pressed]="saved()"
        [attr.aria-label]="(saved() ? 'Remove from' : 'Save to') + ' wishlist: ' + product().name"
        (click)="wishlist.toggle(product().id)"
      >
        <i [class]="saved() ? 'pi pi-heart-fill text-err' : 'pi pi-heart'" aria-hidden="true"></i>
      </button>
      <div class="flex flex-1 flex-col pt-3" [class.pt-0]="list()" [class.justify-center]="list()">
        <p class="eyebrow">{{ product().category }} · {{ product().colorName }}</p>
        <a [routerLink]="['/product', product().id]" class="mt-1 font-display text-lg leading-snug text-ink hover:underline">
          {{ product().name }}
        </a>
        @if (list()) {
          <p class="mt-1 line-clamp-2 text-sm text-muted">{{ product().description }}</p>
        }
        <p class="num mt-1 font-semibold text-ink">{{ product().price | egp }}</p>
      </div>
    </article>
  `,
})
export class ProductTileComponent {
  product = input.required<Product>();
  list = input(false);
  protected wishlist = inject(WishlistService);
  saved = computed(() => this.wishlist.ids().has(this.product().id));
}
