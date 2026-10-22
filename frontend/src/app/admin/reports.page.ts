import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { catchError, forkJoin, map, of, startWith } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ReportSummary, VisitStats } from '../core/models';
import { formatCompact, formatEgp } from '../core/utils';
import { ChartTheme } from '../shared/chart-theme';
import { EgpPipe } from '../shared/egp.pipe';
import { KpiTileComponent } from '../shared/kpi-tile.component';
import { PageHeaderComponent } from '../shared/page-header.component';

interface Data {
  loading: boolean;
  report: ReportSummary | null;
  visits: VisitStats | null;
}

/** Neutralise spreadsheet formula injection and quote every CSV cell. */
function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

@Component({
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, ChartModule, SkeletonModule, TableModule, EgpPipe, KpiTileComponent, PageHeaderComponent],
  template: `
    <app-page-header title="Reports" subtitle="Where the revenue comes from and what is selling.">
      <p-button label="Export CSV" icon="pi pi-download" severity="secondary" [outlined]="true" [disabled]="!r()" (onClick)="exportCsv()" />
    </app-page-header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <app-kpi-tile label="Catalogue value" [loading]="data().loading" [value]="'EGP ' + compact(r()?.catalogValue ?? 0)"
        [title]="'EGP ' + money(r()?.catalogValue ?? 0)" hint="Stock × retail price" />
      <app-kpi-tile label="Units in stock" [loading]="data().loading" [value]="money(r()?.inStock ?? 0)" [hint]="(r()?.totalProducts ?? 0) + ' products'" />
      <app-kpi-tile label="Top category" [loading]="data().loading" [value]="r()?.revenueByCategory?.[0]?.category ?? '—'"
        [hint]="'EGP ' + money(r()?.revenueByCategory?.[0]?.revenue ?? 0) + ' revenue'" />
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-12">
      <section class="ll-card p-5 xl:col-span-7" aria-labelledby="cat-h">
        <h2 id="cat-h" class="font-semibold">Revenue by category</h2>
        <p class="text-xs text-muted">Item revenue before delivery, cancelled orders excluded</p>
        <div class="mt-4 h-80">
          @if (data().loading) { <p-skeleton height="100%" /> } @else {
            <p-chart type="bar" [data]="byCategory()" [options]="barOptions()" height="100%" />
          }
        </div>
      </section>

      <section class="ll-card overflow-hidden xl:col-span-5" aria-labelledby="best-h">
        <h2 id="best-h" class="p-5 pb-3 font-semibold">Best sellers</h2>
        <p-table [value]="r()?.bestSellers ?? []" [loading]="data().loading" size="small">
          <ng-template #header>
            <tr><th scope="col">#</th><th scope="col">Product</th><th scope="col" class="!text-right">Units</th><th scope="col" class="!text-right">Revenue</th></tr>
          </ng-template>
          <ng-template #body let-b let-i="rowIndex">
            <tr>
              <td class="num text-muted">{{ i + 1 }}</td>
              <td class="font-semibold">{{ b.name }}</td>
              <td class="num !text-right">{{ b.unitsSold }}</td>
              <td class="num !text-right">{{ b.revenue | egp }}</td>
            </tr>
          </ng-template>
        </p-table>
      </section>
    </div>

    <section class="ll-card mt-6 p-5" aria-labelledby="vis-h">
      <h2 id="vis-h" class="font-semibold">Store visits</h2>
      <p class="text-xs text-muted">Sessions per day, last 30 days</p>
      <div class="mt-4 h-56">
        @if (!data().loading) {
          <p-chart type="bar" [data]="visits()" [options]="visitOptions()" height="100%" />
        }
      </div>
    </section>
  `,
})
export class ReportsPage {
  private api = inject(ApiService);
  private charts = inject(ChartTheme);

  data = toSignal(
    forkJoin({ report: this.api.getReport(), visits: this.api.getVisitorCount() }).pipe(
      map((d): Data => ({ loading: false, ...d })),
      catchError(() => of<Data>({ loading: false, report: null, visits: null })),
      startWith<Data>({ loading: true, report: null, visits: null }),
    ),
    { initialValue: { loading: true, report: null, visits: null } as Data },
  );
  r = computed(() => this.data().report);

  byCategory = computed(() => {
    const rows = this.r()?.revenueByCategory ?? [];
    return {
      labels: rows.map((c) => c.category),
      datasets: [{ label: 'Revenue', data: rows.map((c) => c.revenue), backgroundColor: this.charts.palette().series[0], borderRadius: 6, barThickness: 22 }],
    };
  });
  barOptions = computed(() => this.charts.cartesian({ money: true, horizontal: true }));

  visits = computed(() => {
    const days = this.data().visits?.viewsByDay ?? [];
    return {
      labels: days.map((d) => new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
      datasets: [{ label: 'Visits', data: days.map((d) => d.count), backgroundColor: this.charts.palette().series[2], borderRadius: 4 }],
    };
  });
  visitOptions = computed(() => this.charts.cartesian());

  money = formatEgp;
  compact = formatCompact;

  exportCsv(): void {
    const r = this.r();
    if (!r) return;
    const rows: unknown[][] = [
      ['Section', 'Name', 'Units', 'Revenue (EGP)'],
      ...r.revenueByCategory.map((c) => ['Category', c.category, c.units, c.revenue]),
      ...r.bestSellers.map((b) => ['Best seller', b.name, b.unitsSold, b.revenue]),
      ...r.lowStock.map((l) => ['Low stock', l.name, l.stock, '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `loomline-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
