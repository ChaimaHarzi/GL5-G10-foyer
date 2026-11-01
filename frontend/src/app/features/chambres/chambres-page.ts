import { Component, inject } from '@angular/core';
import { ChambreService } from '../../core/chambre.service';
import { Chambre, TYPES_CHAMBRE } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { PageConfig } from '../../shared/page-config';

@Component({
  selector: 'app-chambres-page',
  imports: [CrudPage],
  template: `
    <h1>Chambres</h1>
    <p class="lead">Chambres simples, doubles ou triples. On les range dans un bloc depuis la page Blocs.</p>
    <app-crud-page [config]="config" [service]="service" />
  `,
})
export class ChambresPage {
  protected readonly service = inject(ChambreService);

  protected readonly config: PageConfig<Chambre> = {
    title: 'Chambres',
    singular: 'une chambre',
    idKey: 'idChambre',
    fields: [
      { key: 'numeroChambre', label: 'Numéro', type: 'number' },
      { key: 'typeChambre', label: 'Type', type: 'select', options: TYPES_CHAMBRE },
    ],
    columns: [
      { label: 'Id', value: (chambre) => chambre.idChambre },
      { label: 'Numéro', value: (chambre) => chambre.numeroChambre },
      { label: 'Type', value: (chambre) => chambre.typeChambre },
    ],
  };
}
