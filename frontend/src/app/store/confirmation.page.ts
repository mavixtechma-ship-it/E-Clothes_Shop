import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Order } from '../core/models';
import { EgpPipe } from '../shared/egp.pipe';

@Component({
  selector: 'app-confirmation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule, EgpPipe],
  template: `
    <div class="mx-auto max-w-2xl px-4 py-16">
      <div class="ll-card p-8 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft">
          <i class="pi pi-check text-2xl text-brand" aria-hidden="true"></i>
        </span>
        <h1 class="mt-5 font-display text-3xl font-semibold">Thank you — order placed</h1>
        <p class="mt-2 text-muted">
          Order <strong class="num text-ink">{{ orderNumber() }}</strong> is in. This is a demo, so nothing will actually ship.
        </p>

        @if (order; as o) {
          <ul class="mt-8 divide-y divide-[var(--ll-border)] text-left text-sm">
            @for (it of o.items; track $index) {
              <li class="flex justify-between py-2">
                <span>{{ it.qty }} × {{ it.name }} <span class="text-muted">({{ it.size }})</span></span>
                <span class="num">{{ it.price * it.qty | egp }}</span>
              </li>
            }
          </ul>
          <dl class="mt-4 space-y-1 border-t border-line pt-4 text-left text-sm">
            <div class="flex justify-between"><dt class="text-muted">Subtotal</dt><dd class="num">{{ o.subtotal | egp }}</dd></div>
            <div class="flex justify-between"><dt class="text-muted">Delivery ({{ o.customer.governorate }})</dt><dd class="num">{{ o.shippingFee | egp }}</dd></div>
            @if (o.discount) {
              <div class="flex justify-between text-ok"><dt>Promo {{ o.promoCode }}</dt><dd class="num">−{{ o.discount | egp }}</dd></div>
            }
            <div class="flex justify-between pt-2 text-base font-bold"><dt>Total</dt><dd class="num">{{ o.total | egp }}</dd></div>
          </dl>
        }

        <p-button label="Keep shopping" routerLink="/shop" styleClass="mt-8" />
      </div>
    </div>
  `,
})
export class ConfirmationPage {
  orderNumber = input.required<string>();
  /** Passed via router state from checkout; absent after a refresh. */
  order: Order | null = (history.state?.order as Order | undefined) ?? null;
}
