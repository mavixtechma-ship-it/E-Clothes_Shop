import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { OWNER } from '../core/owner';
import { ThemeService } from '../core/theme.service';

/** "About" dialog: identifies this demo system and its developer, Mavix Tech. */
@Component({
  selector: 'app-about-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(28rem, calc(100vw - 2rem))' }"
      header="About"
    >
      <div class="flex flex-col gap-5">
        <div>
          <p class="font-display text-2xl font-semibold leading-tight">Loomline</p>
          <p class="mt-1 text-sm text-muted">Demo system — menswear storefront and admin studio with mock data only.</p>
        </div>
        <div class="mvx rounded-xl p-4">
          <p class="mvx-eyebrow">Developed by</p>
          <img [src]="logo()" [alt]="owner.name" width="168" height="55" class="mt-2 h-11 w-auto" />
          <p class="mvx-accent mt-3 text-xs font-semibold">{{ owner.tagline }}</p>
          <p class="mt-2 text-sm">{{ owner.description }}</p>
          <p class="mt-3 text-sm font-semibold">{{ owner.cta }}</p>
          <a [href]="owner.url" target="_blank" rel="noopener noreferrer" class="mvx-btn mt-4">
            Visit website <i class="pi pi-external-link text-xs" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </p-dialog>
  `,
})
export class AboutDialogComponent {
  private theme = inject(ThemeService);
  visible = model(false);
  protected owner = OWNER;
  protected logo = computed(() => (this.theme.theme() === 'dark' ? OWNER.logoDark : OWNER.logo));
}
