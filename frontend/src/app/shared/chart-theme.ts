import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject } from '@angular/core';
import { ThemeService } from '../core/theme.service';
import { formatCompact, formatEgp } from '../core/utils';

export interface ChartPalette {
  series: string[];
  text: string;
  muted: string;
  grid: string;
  surface: string;
}

/** Chart colours read from CSS tokens; recomputed whenever the theme flips. */
@Injectable({ providedIn: 'root' })
export class ChartTheme {
  private doc = inject(DOCUMENT);
  private theme = inject(ThemeService);

  readonly palette = computed<ChartPalette>(() => {
    this.theme.theme(); // dependency
    const css = getComputedStyle(this.doc.documentElement);
    const v = (n: string) => css.getPropertyValue(n).trim();
    return {
      series: [1, 2, 3, 4, 5, 6].map((i) => v(`--ll-chart-${i}`)),
      text: v('--ll-text'),
      muted: v('--ll-muted'),
      grid: v('--ll-border'),
      surface: v('--ll-surface'),
    };
  });

  /** Common Chart.js options for cartesian charts. */
  cartesian(opts: { money?: boolean; horizontal?: boolean; legend?: boolean } = {}) {
    const p = this.palette();
    const tick = (v: number | string) => (opts.money ? formatCompact(Number(v)) : v);
    const valueAxis = { grid: { color: p.grid }, border: { display: false }, ticks: { color: p.muted, callback: tick } };
    const catAxis = { grid: { display: false }, border: { display: false }, ticks: { color: p.muted, maxRotation: 0, autoSkipPadding: 12 } };
    return {
      maintainAspectRatio: false,
      indexAxis: opts.horizontal ? ('y' as const) : ('x' as const),
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { display: !!opts.legend, labels: { color: p.text, usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          callbacks: opts.money
            ? { label: (ctx: { dataset: { label?: string }; parsed: { x: number; y: number } }) =>
                `${ctx.dataset.label ?? ''}: EGP ${formatEgp(opts.horizontal ? ctx.parsed.x : ctx.parsed.y)}` }
            : {},
        },
      },
      scales: opts.horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis },
    };
  }

  doughnut() {
    const p = this.palette();
    return {
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { position: 'bottom' as const, labels: { color: p.text, usePointStyle: true, boxWidth: 8 } } },
    };
  }
}
