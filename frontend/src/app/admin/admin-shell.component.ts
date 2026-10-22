import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarModule,
    ButtonModule,
    DrawerModule,
    TagModule,
    TooltipModule,
    LogoComponent,
  ],
  template: `
    <ng-template #nav>
      <nav class="flex flex-col gap-1" aria-label="Admin">
        <p class="eyebrow px-3 pb-1 pt-2">Studio</p>
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="!bg-brand-soft !text-brand"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
            (click)="mobileNav.set(false)"
          >
            <i [class]="item.icon" aria-hidden="true"></i>{{ item.label }}
          </a>
        }
        <p class="eyebrow px-3 pb-1 pt-6">Shortcuts</p>
        <a routerLink="/" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
          <i class="pi pi-external-link" aria-hidden="true"></i>View store
        </a>
      </nav>
    </ng-template>

    <div class="flex min-h-screen bg-bg text-ink">
      <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <a routerLink="/admin" class="px-3"><app-logo [size]="30" /></a>
        <div class="mt-6 flex-1"><ng-container [ngTemplateOutlet]="nav" /></div>
        <div class="rounded-xl bg-surface-2 p-3 text-xs text-muted">
          Demo data resets on reload. Nothing here is connected to a real system.
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg px-4 md:px-6">
          <p-button icon="pi pi-bars" [text]="true" severity="secondary" styleClass="lg:!hidden" ariaLabel="Open navigation" (onClick)="mobileNav.set(true)" />
          <span class="text-sm font-semibold text-muted">Loomline Studio</span>
          <div class="ml-auto flex items-center gap-2">
            @if (!auth.canEdit()) {
              <p-tag value="Read-only" icon="pi pi-eye" severity="secondary" pTooltip="Viewer accounts can browse but not change anything" tooltipPosition="bottom" />
            }
            <p-button
              [icon]="theme.theme() === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              [ariaLabel]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              (onClick)="theme.toggle()"
            />
            <span class="hidden items-center gap-2 sm:flex">
              <p-avatar [label]="(auth.username() ?? '?').charAt(0).toUpperCase()" shape="circle" styleClass="!bg-brand-soft !text-brand" />
              <span class="text-sm">
                <span class="block font-semibold leading-tight">{{ auth.username() }}</span>
                <span class="block text-xs capitalize text-muted">{{ auth.role() }}</span>
              </span>
            </span>
            <p-button icon="pi pi-sign-out" [text]="true" severity="secondary" ariaLabel="Sign out" pTooltip="Sign out" tooltipPosition="bottom" (onClick)="auth.logout()" />
          </div>
        </header>
        <main class="mx-auto w-full max-w-[90rem] flex-1 p-4 md:p-8">
          <router-outlet />
        </main>
      </div>
    </div>

    <p-drawer [visible]="mobileNav()" (visibleChange)="mobileNav.set($event)" position="left" [style]="{ width: '16rem' }">
      <ng-template #header><app-logo [size]="28" /></ng-template>
      <ng-container [ngTemplateOutlet]="nav" />
    </p-drawer>
  `,
})
export class AdminShellComponent {
  protected auth = inject(AuthService);
  protected theme = inject(ThemeService);
  mobileNav = signal(false);

  items = [
    { path: '/admin', label: 'Overview', icon: 'pi pi-home', exact: true },
    { path: '/admin/products', label: 'Products', icon: 'pi pi-tags', exact: false },
    { path: '/admin/orders', label: 'Orders', icon: 'pi pi-receipt', exact: false },
    { path: '/admin/reports', label: 'Reports', icon: 'pi pi-chart-bar', exact: false },
  ];
}
