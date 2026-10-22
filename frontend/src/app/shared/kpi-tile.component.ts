import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/** Admin KPI tile: label, big tabular value, optional hint. */
@Component({
  selector: 'app-kpi-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonModule],
  host: { class: 'block' },
  template: `
    <div class="ll-card h-full p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">{{ label() }}</span>
        @if (icon()) {
          <i [class]="icon() + ' text-muted'" aria-hidden="true"></i>
        }
      </div>
      @if (loading()) {
        <p-skeleton height="2rem" width="60%" styleClass="mt-3" />
      } @else {
        <div class="num mt-2 text-2xl font-bold text-ink" [attr.title]="title() || null">{{ value() }}</div>
      }
      @if (hint()) {
        <div class="mt-1 text-xs text-muted">{{ hint() }}</div>
      }
    </div>
  `,
})
export class KpiTileComponent {
  label = input.required<string>();
  value = input<string | number>('');
  hint = input<string>('');
  icon = input<string>('');
  title = input<string>('');
  loading = input(false);
}
