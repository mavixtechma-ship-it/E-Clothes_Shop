import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth/auth.service';
import { ORDER_STATUSES, Order, OrderStatus } from '../core/models';
import { EgpPipe } from '../shared/egp.pipe';
import { PageHeaderComponent } from '../shared/page-header.component';
import { StatusTagComponent } from '../shared/status-tag.component';

@Component({
  selector: 'app-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    DrawerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    EgpPipe,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `
    <app-page-header title="Orders" [subtitle]="summary()" />

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <p-iconfield class="w-full sm:w-72">
        <p-inputicon styleClass="pi pi-search" />
        <input pInputText type="search" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Order no., customer or email" aria-label="Search orders" maxlength="60" class="w-full" />
      </p-iconfield>
      <p-selectbutton [options]="statusFilterOptions" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event ?? 'All')" [allowEmpty]="false" ariaLabelledBy="status" />
    </div>

    <div class="ll-card overflow-hidden">
      <p-table
        [value]="filtered()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="12"
        sortField="createdAt"
        [sortOrder]="-1"
        dataKey="id"
        selectionMode="single"
        [selection]="selected()"
        (onRowSelect)="onSelect($event.data)"
        [tableStyle]="{ 'min-width': '50rem' }"
        size="small"
      >
        <ng-template #header>
          <tr>
            <th scope="col" pSortableColumn="orderNumber">Order <p-sortIcon field="orderNumber" /></th>
            <th scope="col" pSortableColumn="createdAt">Placed <p-sortIcon field="createdAt" /></th>
            <th scope="col">Customer</th>
            <th scope="col">Area</th>
            <th scope="col" pSortableColumn="status">Status <p-sortIcon field="status" /></th>
            <th scope="col" pSortableColumn="total" class="!text-right">Total <p-sortIcon field="total" /></th>
          </tr>
        </ng-template>
        <ng-template #body let-o>
          <tr [pSelectableRow]="o" class="cursor-pointer">
            <td class="num font-semibold">{{ o.orderNumber }}</td>
            <td class="text-sm"><span [title]="o.createdAt">{{ o.createdAt | date: 'd MMM y, HH:mm' }}</span></td>
            <td><div>{{ o.customer.name }}</div><div class="text-xs text-muted">{{ o.customer.email }}</div></td>
            <td>{{ o.customer.governorate }}</td>
            <td><app-status-tag [status]="o.status" /></td>
            <td class="num !text-right font-semibold">{{ o.total | egp }}</td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="6" class="py-10 text-center text-muted">No orders match.</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-drawer [visible]="!!selected()" (visibleChange)="!$event && selected.set(null)" position="right" [style]="{ width: 'min(30rem, 100vw)' }">
      <ng-template #header>
        @if (selected(); as o) {
          <div>
            <div class="num font-display text-xl font-semibold">{{ o.orderNumber }}</div>
            <div class="text-xs text-muted">{{ o.createdAt | date: 'EEEE d MMMM y, HH:mm' }}</div>
          </div>
        }
      </ng-template>
      @if (selected(); as o) {
        <section class="space-y-6">
          <div class="rounded-xl bg-surface-2 p-4">
            <div class="flex items-center justify-between">
              <span class="eyebrow">Status</span>
              <app-status-tag [status]="o.status" />
            </div>
            @if (auth.canEdit()) {
              <div class="mt-3 flex gap-2">
                <p-select [options]="statuses" [(ngModel)]="nextStatus" placeholder="Change status" appendTo="body" class="flex-1" ariaLabel="New status" />
                <p-button label="Update" [disabled]="!nextStatus || nextStatus === o.status" [loading]="updating()" (onClick)="updateStatus(o)" />
              </div>
            } @else {
              <p class="mt-2 text-xs text-muted">Viewer accounts cannot change order status.</p>
            }
          </div>

          <div>
            <h3 class="eyebrow mb-2">Customer</h3>
            <p class="font-semibold">{{ o.customer.name }}</p>
            <p class="text-sm text-muted">{{ o.customer.email }} · {{ o.customer.phone }}</p>
            <p class="text-sm text-muted">{{ o.customer.address }}, {{ o.customer.city }}, {{ o.customer.governorate }}</p>
          </div>

          <div>
            <h3 class="eyebrow mb-2">Items</h3>
            <ul class="divide-y divide-[var(--ll-border)] text-sm">
              @for (it of o.items; track $index) {
                <li class="flex justify-between py-2">
                  <span>{{ it.qty }} × {{ it.name }} <span class="text-muted">· {{ it.size }}</span></span>
                  <span class="num">{{ it.price * it.qty | egp }}</span>
                </li>
              }
            </ul>
            <dl class="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd class="num">{{ o.subtotal | egp }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted">Delivery</dt><dd class="num">{{ o.shippingFee | egp }}</dd></div>
              @if (o.discount) {
                <div class="flex justify-between"><dt class="text-muted">Promo {{ o.promoCode }}</dt><dd class="num">−{{ o.discount | egp }}</dd></div>
              }
              <div class="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd class="num">{{ o.total | egp }}</dd></div>
            </dl>
          </div>
        </section>
      }
    </p-drawer>
  `,
})
export class OrdersPage {
  private api = inject(ApiService);
  private toast = inject(MessageService);
  protected auth = inject(AuthService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  selected = signal<Order | null>(null);
  updating = signal(false);
  nextStatus: OrderStatus | null = null;

  statuses = [...ORDER_STATUSES];
  statusFilterOptions = ['All', 'Open', ...ORDER_STATUSES];
  search = signal('');
  statusFilter = signal<string>('All');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const s = this.statusFilter();
    return this.orders().filter(
      (o) =>
        (s === 'All' || (s === 'Open' ? o.status === 'Paid' || o.status === 'Processing' : o.status === s)) &&
        (!q || [o.orderNumber, o.customer.name, o.customer.email].some((v) => v.toLowerCase().includes(q))),
    );
  });

  summary = computed(() => {
    const open = this.orders().filter((o) => o.status === 'Paid' || o.status === 'Processing').length;
    return `${this.orders().length} orders · ${open} open`;
  });

  constructor() {
    this.api.getOrders().subscribe({
      next: (o) => {
        this.orders.set(o);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.add({ severity: 'error', summary: 'Could not load orders' });
      },
    });
  }

  onSelect(data: Order | Order[] | undefined): void {
    this.nextStatus = null;
    this.selected.set(Array.isArray(data) ? null : (data ?? null));
  }

  updateStatus(o: Order): void {
    const status = this.nextStatus;
    if (!status || !this.auth.canEdit()) return;
    this.updating.set(true);
    this.api.setOrderStatus(o.id, status).subscribe({
      next: (updated) => {
        this.updating.set(false);
        this.nextStatus = null;
        this.orders.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.selected.set(updated);
        this.toast.add({ severity: 'success', summary: 'Status updated', detail: `${updated.orderNumber} → ${updated.status}` });
      },
      error: (e: unknown) => {
        this.updating.set(false);
        const msg = e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : 'Update failed';
        this.toast.add({ severity: 'error', summary: 'Not updated', detail: msg });
      },
    });
  }
}
