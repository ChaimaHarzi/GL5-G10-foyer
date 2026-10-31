import { Component, inject } from '@angular/core';
import { Icon } from '../icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of service.toasts(); track t.id) {
        <div class="toast" [class.erreur]="t.type === 'erreur'" role="status">
          <span class="toast-icone"><app-icon [nom]="t.type === 'erreur' ? 'alert' : 'check'" [taille]="20" /></span>
          <p>{{ t.message }}</p>
          <button type="button" class="btn-icone" aria-label="Fermer la notification" (click)="service.fermer(t.id)">
            <app-icon nom="x" [taille]="16" />
          </button>
        </div>
      }
    </div>
  `
})
export class Toasts {
  protected readonly service = inject(ToastService);
}
