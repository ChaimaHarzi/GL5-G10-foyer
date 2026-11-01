import { Component, input, output } from '@angular/core';
import { Icon, NomIcone } from './icon';
import { Modal } from './modal';

// Asks for a confirmation before a destructive action (deletion, unassignment...)
@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal, Icon],
  template: `
    <app-modal [titre]="titre()" (fermer)="annuler.emit()">
      <div class="confirm">
        <span class="confirm-icone"><app-icon [nom]="icone()" [taille]="22" /></span>
        <p>{{ message() }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondaire" (click)="annuler.emit()">Annuler</button>
        <button type="button" class="btn btn-danger" data-test="confirmer" [disabled]="enCours()" (click)="confirmer.emit()">
          {{ enCours() ? libelleEnCours() : libelleConfirmer() }}
        </button>
      </div>
    </app-modal>
  `
})
export class ConfirmDialog {
  readonly titre = input.required<string>();
  readonly message = input.required<string>();
  readonly libelleConfirmer = input('Confirmer');
  readonly libelleEnCours = input('Suppression…');
  readonly icone = input<NomIcone>('trash');
  readonly enCours = input(false);
  readonly confirmer = output<void>();
  readonly annuler = output<void>();
}
