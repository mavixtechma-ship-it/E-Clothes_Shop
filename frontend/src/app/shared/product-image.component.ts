import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { safeImageUrl } from '../core/utils';

/** Product image with a safe-URL check and a neutral placeholder. */
@Component({
  selector: 'app-product-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="ll-frame">
      @if (src(); as s) {
        <img [src]="s" [alt]="alt()" loading="lazy" decoding="async" />
      } @else {
        <div class="flex h-full w-full items-center justify-center" [style.background]="tint()">
          <i class="pi pi-image text-2xl text-muted" aria-hidden="true"></i>
          <span class="sr-only">{{ alt() }}</span>
        </div>
      }
    </div>
  `,
})
export class ProductImageComponent {
  url = input<string | undefined | null>(null);
  alt = input('');
  color = input<string | undefined>(undefined);
  small = input(false);

  src = computed(() => safeImageUrl(this.url()));
  tint = computed(() => {
    const c = this.color();
    return c && /^#[0-9a-fA-F]{6}$/.test(c) ? `${c}33` : 'var(--ll-surface-2)';
  });
}
