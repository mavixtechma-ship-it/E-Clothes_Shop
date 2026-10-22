import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Loomline mark (woven "L") + optional wordmark. Pure inline SVG, no external assets. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2.5" [attr.aria-label]="label()">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 40 40" aria-hidden="true" focusable="false" class="rounded-[10px] ring-1 ring-black/5 dark:ring-white/10">
        <rect width="40" height="40" rx="10" class="fill-brand" />
        <g fill="none" stroke-linecap="round" class="stroke-[var(--ll-sand)] dark:stroke-[var(--ll-on-brand)]">
          <path d="M9 14h4m4 0h14" stroke-width="2" opacity=".6" />
          <path d="M9 20h4m4 0h14" stroke-width="2" opacity=".6" />
          <path d="M15 9v22h16" stroke-width="4.5" />
          <path d="M24 9v9m0 4v3" stroke-width="2" opacity=".6" />
        </g>
      </svg>
      @if (wordmark()) {
        <span class="font-display text-[1.35rem] font-semibold leading-none tracking-tight text-ink">
          Loomline<span class="text-muted">.</span>
        </span>
      }
    </span>
  `,
})
export class LogoComponent {
  size = input(34);
  wordmark = input(true);
  label = input('Loomline');
}
