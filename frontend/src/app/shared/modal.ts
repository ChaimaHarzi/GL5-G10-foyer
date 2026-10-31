import { Component, input, output } from '@angular/core';
import { Icon } from './icon';

// Dialog window over the page; closes with the X button, a click outside or the Escape key
@Component({
  selector: 'app-modal',
  imports: [Icon],
  host: { '(document:keydown.escape)': 'fermer.emit()' },
  template: `
    <div class="modal-voile" (click)="fermer.emit()"></div>
    <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="titre()">
      <header class="modal-entete">
        <h3>{{ titre() }}</h3>
        <button type="button" class="btn-icone" aria-label="Fermer" (click)="fermer.emit()">
          <app-icon nom="x" />
        </button>
      </header>
      <div class="modal-corps">
        <ng-content />
      </div>
    </div>
  `
})
export class Modal {
  readonly titre = input.required<string>();
  readonly fermer = output<void>();
}
