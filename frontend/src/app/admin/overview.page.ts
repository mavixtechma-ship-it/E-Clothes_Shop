import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { catchError, forkJoin, map, of, startWith } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Order, ReportSummary, VisitStats } from '../core/models';
import { formatCompact, formatEgp } from '../core/utils';
import { ChartTheme } from '../shared/chart-theme';
import { EgpPipe } from '../shared/egp.pipe';
import { KpiTileComponent } from '../shared/kpi-tile.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { StatusTagComponent } from '../shared/status-tag.component';

interface Data {
  loading: boolean;
  error: boolean;
  report: ReportSummary | null;
  orders: Order[];
  visits: VisitStats | null;
}

@Component({
  selector: 'app-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    ChartModule,
    SkeletonModule,
    TableModule,
    TagModule,
    EgpPipe,
    KpiTileComponent,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  template: `
    <app-page-header title="Overview" subtitle="Last 30 days of trading, from the demo dataset." />

    @if (data().error) {
      <div class="ll-card p-6 text-sm text-err">Could not load the overview. Reload to try again.</div>
    }

    <!-- KPI strip -->
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <app-kpi-tile label="Revenue" icon="pi pi-wallet" [loading]="data().loading" [value]="'EGP ' + compact(r()?.revenue ?? 0)"
        [title]="'EGP ' + money(r()?.revenue ?? 0)" hint="Excludes cancelled orders" />
      <app-kpi-tile label="Orders" icon="pi pi-receipt" [loading]="data().loading" [value]="r()?.orders ?? 0"
        [hint]="openOrders() + ' awaiting dispatch'" />
      <app-kpi-tile label="Average order" icon="pi pi-calculator" [loading]="data().loading" [value]="'EGP ' + money(r()?.averageOrder ?? 0)" />
      <app-kpi-tile label="Visitors today" icon="pi pi-users" [loading]="data().loading" [value]="data().visits?.today ?? 0"
        [hint]="compact(data().visits?.totalViews ?? 0) + ' all-time views'" />
    </div>

    <!-- Trend + low stock -->
    <div class="mt-6 grid gap-6 xl:grid-cols-12">
      <section class="ll-card p-5 xl:col-span-8" aria-labelledby="trend-h">
        <h2 id="trend-h" class="font-semibold">Daily revenue</h2>
        <p class="text-xs text-muted">Orders placed per day, net of discounts</p>
        <div class="mt-4 h-72">
          @if (data().loading) {
            <p-skeleton height="100%" />
          } @else {
            <p-chart type="line" [data]="trend()" [options]="trendOptions()" height="100%" />
          }
        </div>
      </section>

      <section class="ll-card p-5 xl:col-span-4" aria-labelledby="low-h">
        <div class="flex items-center justify-between">
          <h2 id="low-h" class="font-semibold">Running low</h2>
          <a routerLink="/admin/products" class="text-xs font-semibold text-brand">Products →</a>
        </div>
        <ul class="mt-3 divide-y divide-[var(--ll-border)]">
          @for (item of r()?.lowStock ?? []; track item.id) {
            <li class="flex items-center justify-between py-2.5 text-sm">
              <span class="truncate pr-2">{{ item.name }}</span>
              <p-tag [value]="item.stock === 0 ? 'Sold out' : item.stock + ' left'" [severity]="item.stock === 0 ? 'danger' : 'warn'" />
            </li>
          } @empty {
            <li class="py-6 text-center text-sm text-muted">{{ data().loading ? 'Loading…' : 'Every product is well stocked.' }}</li>
          }
        </ul>
      </section>
    </div>

    <!-- Recent orders + status mix -->
    <div class="mt-6 grid gap-6 xl:grid-cols-12">
      <section class="ll-card overflow-hidden xl:col-span-7" aria-labelledby="recent-h">
        <div class="flex items-center justify-between p-5 pb-3">
          <h2 id="recent-h" class="font-semibold">Latest orders</h2>
          <a routerLink="/admin/orders" class="text-xs font-semibold text-brand">All orders →</a>
        </div>
        <p-table [value]="recent()" [loading]="data().loading" size="small" [tableStyle]="{ 'min-width': '32rem' }">
          <ng-template #header>
            <tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col" class="!text-right">Total</th></tr>
          </ng-template>
          <ng-template #body let-o>
            <tr>
              <td><span class="num font-semibold">{{ o.orderNumber }}</span><br /><span class="text-xs text-muted">{{ o.createdAt | date: 'd MMM, HH:mm' }}</span></td>
              <td>{{ o.customer.name }}</td>
              <td><app-status-tag [status]="o.status" /></td>
              <td class="num !text-right font-semibold">{{ o.total | egp }}</td>
            </tr>
          </ng-template>
        </p-table>
      </section>

      <section class="ll-card p-5 xl:col-span-5" aria-labelledby="mix-h">
        <h2 id="mix-h" class="font-semibold">Order status mix</h2>
        <div class="mt-4 h-64">
          @if (!data().loading) {
            <p-chart type="doughnut" [data]="statusMix()" [options]="donutOptions()" height="100%" />
          }
        </div>
      </section>
    </div>
  `,
})
export class OverviewPage {
  private api = inject(ApiService);
  private charts = inject(ChartTheme);

  data = toSignal(
    forkJoin({
      report: this.api.getReport(),
      orders: this.api.getOrders(),
      visits: this.api.getVisitorCount(),
    }).pipe(
      map((d): Data => ({ loading: false, error: false, ...d })),
      catchError(() => of<Data>({ loading: false, error: true, report: null, orders: [], visits: null })),
      startWith<Data>({ loading: true, error: false, report: null, orders: [], visits: null }),
    ),
    { initialValue: { loading: true, error: false, report: null, orders: [], visits: null } as Data },
  );

  r = computed(() => this.data().report);
  recent = computed(() => this.data().orders.slice(0, 6));
  openOrders = computed(() => this.data().orders.filter((o) => o.status === 'Paid' || o.status === 'Processing').length);

  trend = computed(() => {
    const p = this.charts.palette();
    const days = this.r()?.revenueByDay ?? [];
    return {
      labels: days.map((d) => new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: 'Revenue',
          data: days.map((d) => d.revenue),
          borderColor: p.series[0],
          backgroundColor: p.series[0] + '22',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  });
  trendOptions = computed(() => this.charts.cartesian({ money: true }));

  statusMix = computed(() => {
    const p = this.charts.palette();
    const rows = (this.r()?.ordersByStatus ?? []).filter((s) => s.count > 0);
    return {
      labels: rows.map((s) => s.status),
      datasets: [{ data: rows.map((s) => s.count), backgroundColor: p.series, borderColor: p.surface, borderWidth: 2 }],
    };
  });
  donutOptions = computed(() => this.charts.doughnut());

  money = formatEgp;
  compact = formatCompact;
}
