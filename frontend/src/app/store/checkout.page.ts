import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { ShippingZone } from '../core/models';
import { EgpPipe } from '../shared/egp.pipe';
import { ProductImageComponent } from '../shared/product-image.component';

@Component({
  selector: 'app-checkout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    StepperModule,
    EgpPipe,
    ProductImageComponent,
  ],
  template: `
    <div class="mx-auto max-w-content px-4 py-10">
      <h1 class="font-display text-4xl font-semibold">Checkout</h1>

      @if (!cart.lines().length) {
        <div class="ll-card mt-8 p-10 text-center">
          <i class="pi pi-shopping-bag text-4xl text-muted" aria-hidden="true"></i>
          <p class="mt-3 text-muted">Your bag is empty.</p>
          <p-button label="Browse the shop" routerLink="/shop" styleClass="mt-4" />
        </div>
      } @else {
        <div class="mt-8 grid gap-8 lg:grid-cols-12">
          <div class="lg:col-span-8">
            <p-stepper [value]="step()" (valueChange)="step.set($event ?? 1)" [linear]="true">
              <p-step-list>
                <p-step [value]="1">Bag</p-step>
                <p-step [value]="2">Delivery</p-step>
                <p-step [value]="3">Review</p-step>
              </p-step-list>
              <p-step-panels>
                <!-- 1. Bag -->
                <p-step-panel [value]="1">
                  <ng-template #content>
                    <ul class="divide-y divide-[var(--ll-border)]">
                      @for (l of cart.lines(); track l.productId + '-' + l.size) {
                        <li class="flex items-center gap-4 py-4">
                          <app-product-image class="w-20 shrink-0" [url]="l.imageUrl" [alt]="l.name" [color]="l.color" />
                          <div class="flex-1">
                            <a [routerLink]="['/product', l.productId]" class="font-semibold">{{ l.name }}</a>
                            <div class="text-xs text-muted">{{ l.category }} · Size {{ l.size }}</div>
                          </div>
                          <p-inputnumber [ngModel]="l.qty" (ngModelChange)="cart.setQty(l.productId, l.size, $event ?? 0)"
                            [showButtons]="true" buttonLayout="horizontal" [min]="0" [max]="10" size="small"
                            inputStyleClass="!w-10 text-center" decrementButtonIcon="pi pi-minus" incrementButtonIcon="pi pi-plus"
                            [ariaLabel]="'Quantity of ' + l.name" />
                          <span class="num w-24 text-right font-semibold">{{ l.price * l.qty | egp }}</span>
                        </li>
                      }
                    </ul>
                    <div class="flex justify-end pt-4">
                      <p-button label="Continue to delivery" icon="pi pi-arrow-right" iconPos="right" (onClick)="step.set(2)" />
                    </div>
                  </ng-template>
                </p-step-panel>

                <!-- 2. Delivery -->
                <p-step-panel [value]="2">
                  <ng-template #content>
                    <form [formGroup]="form" class="grid gap-4 sm:grid-cols-2" (ngSubmit)="toReview()" novalidate>
                      @for (f of fields; track f.key) {
                        <label class="flex flex-col gap-1.5 text-sm font-semibold" [class.sm:col-span-2]="f.wide">
                          {{ f.label }}
                          <input pInputText [formControlName]="f.key" [type]="f.type" [attr.autocomplete]="f.auto"
                            [attr.maxlength]="f.max" [attr.aria-invalid]="invalid(f.key)" [placeholder]="f.placeholder" />
                          @if (invalid(f.key)) {
                            <small class="font-normal text-err">{{ f.error }}</small>
                          }
                        </label>
                      }
                      <label class="flex flex-col gap-1.5 text-sm font-semibold">
                        Delivery area
                        <p-select formControlName="governorate" [options]="zones()" optionLabel="area" optionValue="area"
                          placeholder="Choose an area" [filter]="true" filterBy="area" appendTo="body" ariaLabel="Delivery area" />
                        @if (invalid('governorate')) {
                          <small class="font-normal text-err">Choose where we deliver.</small>
                        }
                      </label>
                      <div class="flex justify-between pt-2 sm:col-span-2">
                        <p-button label="Back" severity="secondary" [text]="true" icon="pi pi-arrow-left" (onClick)="step.set(1)" />
                        <p-button type="submit" label="Review order" icon="pi pi-arrow-right" iconPos="right" />
                      </div>
                    </form>
                  </ng-template>
                </p-step-panel>

                <!-- 3. Review -->
                <p-step-panel [value]="3">
                  <ng-template #content>
                    <div class="grid gap-6 sm:grid-cols-2">
                      <div>
                        <h2 class="eyebrow mb-2">Deliver to</h2>
                        <p class="font-semibold">{{ form.value.name }}</p>
                        <p class="text-sm text-muted">{{ form.value.address }}, {{ form.value.city }}<br />{{ form.value.governorate }}</p>
                        <p class="mt-1 text-sm text-muted">{{ form.value.email }} · {{ form.value.phone }}</p>
                      </div>
                      <div>
                        <h2 class="eyebrow mb-2">Promo code</h2>
                        <div class="flex gap-2">
                          <input pInputText [(ngModel)]="promo" [ngModelOptions]="{ standalone: true }" maxlength="20"
                            placeholder="Optional" aria-label="Promo code" class="flex-1 uppercase" />
                        </div>
                        <p class="mt-1 text-xs text-muted">Codes are checked when the order is placed.</p>
                      </div>
                    </div>
                    @if (error()) {
                      <p-message severity="error" [text]="error()!" styleClass="mt-4" />
                    }
                    <div class="flex justify-between pt-6">
                      <p-button label="Back" severity="secondary" [text]="true" icon="pi pi-arrow-left" (onClick)="step.set(2)" />
                      <p-button label="Place order" icon="pi pi-lock" [loading]="placing()" (onClick)="place()" />
                    </div>
                  </ng-template>
                </p-step-panel>
              </p-step-panels>
            </p-stepper>
          </div>

          <!-- Summary -->
          <aside class="lg:col-span-4">
            <div class="ll-card sticky top-24 p-6">
              <h2 class="font-display text-xl font-semibold">Summary</h2>
              <dl class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between"><dt class="text-muted">Items ({{ cart.count() }})</dt><dd class="num">{{ cart.subtotal() | egp }}</dd></div>
                <div class="flex justify-between">
                  <dt class="text-muted">Delivery</dt>
                  <dd class="num">{{ fee() === null ? '—' : (fee() | egp) }}</dd>
                </div>
                <div class="flex justify-between border-t border-line pt-3 text-base font-bold">
                  <dt>Estimated total</dt><dd class="num">{{ cart.subtotal() + (fee() ?? 0) | egp }}</dd>
                </div>
              </dl>
              <p class="mt-3 text-xs text-muted">Final prices, delivery and discounts are confirmed by the server when you place the order. Demo only — no payment is taken.</p>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CheckoutPage {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(MessageService);
  protected cart = inject(CartService);

  step = signal(1);
  placing = signal(false);
  error = signal<string | null>(null);
  promo = '';

  zones = toSignal(this.api.getShippingZones().pipe(catchError(() => of([] as ShippingZone[]))), {
    initialValue: [] as ShippingZone[],
  });

  form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{6,24}$/)]],
    address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(160)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    governorate: ['', Validators.required],
  });

  private governorate = toSignal(this.form.controls.governorate.valueChanges, { initialValue: '' });
  fee = computed(() => this.zones().find((z) => z.area === this.governorate())?.fee ?? null);

  fields = [
    { key: 'name', label: 'Full name', type: 'text', auto: 'name', max: 80, wide: true, placeholder: '', error: 'Enter your name.' },
    { key: 'email', label: 'Email', type: 'email', auto: 'email', max: 120, wide: false, placeholder: 'you@example.com', error: 'Enter a valid email.' },
    { key: 'phone', label: 'Phone', type: 'tel', auto: 'tel', max: 24, wide: false, placeholder: '555-0100', error: 'Digits, spaces, + and - only.' },
    { key: 'address', label: 'Street address', type: 'text', auto: 'street-address', max: 160, wide: true, placeholder: '', error: 'Enter a street address.' },
    { key: 'city', label: 'City / district', type: 'text', auto: 'address-level2', max: 60, wide: false, placeholder: '', error: 'Enter a city.' },
  ] as const;

  invalid(key: 'name' | 'email' | 'phone' | 'address' | 'city' | 'governorate'): boolean {
    const c = this.form.controls[key];
    return c.invalid && (c.touched || c.dirty);
  }

  toReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.step.set(3);
  }

  place(): void {
    if (this.form.invalid || !this.cart.lines().length) return;
    this.placing.set(true);
    this.error.set(null);
    this.api
      .createOrder({
        customer: this.form.getRawValue(),
        items: this.cart.lines().map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
        promoCode: this.promo.trim() || undefined,
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.toast.add({ severity: 'success', summary: 'Order placed', detail: order.orderNumber });
          this.router.navigate(['/confirmation', order.orderNumber], { state: { order } });
        },
        error: (e: unknown) => {
          this.placing.set(false);
          const msg = e instanceof HttpErrorResponse && e.status < 500 ? e.error?.message : null;
          this.error.set(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.');
        },
      });
  }
}
