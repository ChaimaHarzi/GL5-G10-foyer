import { Component, inject } from '@angular/core';
import { FoyerService } from '../../core/foyer.service';
import { Foyer } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { PageConfig } from '../../shared/page-config';

@Component({
  selector: 'app-foyers-page',
  imports: [CrudPage],
  template: `
    <h1>Foyers</h1>
    <p class="lead">Les foyers universitaires et leur capacité d’accueil.</p>
    <app-crud-page [config]="config" [service]="service" />
  `,
})
export class FoyersPage {
  protected readonly service = inject(FoyerService);

  protected readonly config: PageConfig<Foyer> = {
    title: 'Foyers',
    singular: 'un foyer',
    idKey: 'idFoyer',
    fields: [
      { key: 'nomFoyer', label: 'Nom', type: 'text' },
      { key: 'capaciteFoyer', label: 'Capacité', type: 'number' },
    ],
    columns: [
      { label: 'Id', value: (foyer) => foyer.idFoyer },
      { label: 'Nom', value: (foyer) => foyer.nomFoyer },
      { label: 'Capacité', value: (foyer) => foyer.capaciteFoyer },
    ],
  };
}
