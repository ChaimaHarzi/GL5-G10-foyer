import { Component, inject } from '@angular/core';
import { isoDate } from '../../core/errors';
import { EtudiantService } from '../../core/etudiant.service';
import { Etudiant } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { PageConfig } from '../../shared/page-config';

@Component({
  selector: 'app-etudiants-page',
  imports: [CrudPage],
  template: `
    <h1>Étudiants</h1>
    <p class="lead">Les étudiants, identifiés par leur CIN pour les réservations.</p>
    <app-crud-page [config]="config" [service]="service" />
  `,
})
export class EtudiantsPage {
  protected readonly service = inject(EtudiantService);

  protected readonly config: PageConfig<Etudiant> = {
    title: 'Étudiants',
    singular: 'un étudiant',
    idKey: 'idEtudiant',
    fields: [
      { key: 'nomEtudiant', label: 'Nom', type: 'text' },
      { key: 'prenomEtudiant', label: 'Prénom', type: 'text' },
      { key: 'cinEtudiant', label: 'CIN', type: 'number' },
      { key: 'dateNaissance', label: 'Date de naissance', type: 'date' },
    ],
    columns: [
      { label: 'Id', value: (etudiant) => etudiant.idEtudiant },
      { label: 'Nom', value: (etudiant) => etudiant.nomEtudiant },
      { label: 'Prénom', value: (etudiant) => etudiant.prenomEtudiant },
      { label: 'CIN', value: (etudiant) => etudiant.cinEtudiant },
      { label: 'Date de naissance', value: (etudiant) => isoDate(etudiant.dateNaissance) },
    ],
  };
}
