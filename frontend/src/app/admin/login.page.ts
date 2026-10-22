import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule, PasswordModule, LogoComponent],
  template: `
    <div class="grid min-h-screen bg-bg lg:grid-cols-2">
      <section class="relative hidden overflow-hidden bg-brand p-12 text-on-brand lg:flex lg:flex-col">
        <app-logo [wordmark]="false" [size]="44" />
        <div class="mt-auto">
          <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Loomline Studio</p>
          <h1 class="mt-3 font-display text-5xl font-semibold leading-tight">Run the shop<br />from one quiet room.</h1>
          <p class="mt-4 max-w-sm opacity-80">Catalogue, orders and the numbers behind them. Demo data only.</p>
        </div>
        <svg class="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] opacity-10" viewBox="0 0 200 200" aria-hidden="true">
          @for (i of lines; track i) {
            <line [attr.x1]="0" [attr.y1]="i * 10" [attr.x2]="200" [attr.y2]="i * 10" stroke="currentColor" stroke-width="3" />
            <line [attr.x1]="i * 10" [attr.y1]="0" [attr.x2]="i * 10" [attr.y2]="200" stroke="currentColor" stroke-width="1" />
          }
        </svg>
      </section>

      <section class="flex items-center justify-center p-6">
        <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-sm" novalidate>
          <div class="mb-8 flex items-center justify-between">
            <app-logo class="lg:hidden" />
            <a routerLink="/" class="ll-link ml-auto text-sm text-muted">← Back to store</a>
          </div>
          <h2 class="font-display text-3xl font-semibold">Sign in</h2>
          <p class="mt-1 text-sm text-muted">Use the <code>admin</code> or <code>viewer</code> account from CREDENTIALS.md.</p>

          @if (notice()) {
            <p-message severity="warn" [text]="notice()!" styleClass="mt-6" />
          }
          @if (error()) {
            <p-message severity="error" [text]="error()!" styleClass="mt-6" />
          }

          <label class="mt-6 flex flex-col gap-1.5 text-sm font-semibold">
            Username
            <input pInputText formControlName="username" autocomplete="username" maxlength="64" autocapitalize="none" spellcheck="false" />
          </label>
          <label class="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
            Password
            <p-password formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="current-password"
              [maxLength]="256" styleClass="w-full" inputStyleClass="w-full" ariaLabel="Password" />
          </label>

          <p-button type="submit" label="Sign in" icon="pi pi-sign-in" [loading]="busy()" [disabled]="form.invalid" styleClass="mt-6 w-full" />
          <p class="mt-6 text-xs text-muted">
            Passwords are verified in-browser against salted PBKDF2 hashes. This is a demo access gate, not production security.
          </p>
        </form>
      </section>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  constructor() {
    inject(ThemeService);
  }

  lines = Array.from({ length: 21 }, (_, i) => i);
  busy = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('reason') === 'expired' ? 'Your session ended. Please sign in again.' : null,
  );

  form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(64)]],
    password: ['', [Validators.required, Validators.maxLength(256)]],
  });

  submit(): void {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/admin'], { replaceUrl: true }),
      error: (e: unknown) => {
        this.busy.set(false);
        this.form.controls.password.reset();
        this.error.set(
          e instanceof HttpErrorResponse && e.status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : 'Invalid username or password.',
        );
      },
    });
  }
}
