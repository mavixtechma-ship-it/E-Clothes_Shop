import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { OrderStatus } from '../core/models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const MAP: Record<OrderStatus, { severity: Severity; icon: string }> = {
  Paid: { severity: 'info', icon: 'pi pi-wallet' },
  Processing: { severity: 'warn', icon: 'pi pi-cog' },
  Shipped: { severity: 'contrast', icon: 'pi pi-truck' },
  Delivered: { severity: 'success', icon: 'pi pi-check' },
  Cancelled: { severity: 'danger', icon: 'pi pi-times' },
};

/** Order status → tag (icon + text, never colour alone). */
@Component({
  selector: 'app-status-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagModule],
  template: `<p-tag [value]="status()" [severity]="meta().severity" [icon]="meta().icon" [rounded]="true" />`,
})
export class StatusTagComponent {
  status = input.required<OrderStatus>();
  meta = computed(() => MAP[this.status()] ?? { severity: 'secondary' as Severity, icon: 'pi pi-circle' });
}
