import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ApiService } from './core/api.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <router-outlet />
    <p-toast position="bottom-right" />
    <p-confirmdialog />
  `,
})
export class AppComponent {
  private api = inject(ApiService);

  constructor() {
    inject(ThemeService); // apply saved theme on boot
    try {
      if (!sessionStorage.getItem('loomline.visit')) {
        this.api.trackVisit().subscribe({
          next: () => sessionStorage.setItem('loomline.visit', '1'),
          error: () => undefined,
        });
      }
    } catch {
      /* storage unavailable — skip tracking */
    }
  }
}
