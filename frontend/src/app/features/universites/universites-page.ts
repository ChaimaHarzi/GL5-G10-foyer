import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { errorMessage } from '../../core/errors';
import { FoyerService } from '../../core/foyer.service';
import { Foyer, Universite } from '../../core/models';
import { UniversiteService } from '../../core/universite.service';
import { CrudPage } from '../../shared/crud-page';
import { PageConfig } from '../../shared/page-config';

@Component({
  selector: 'app-universites-page',
  imports: [CrudPage, ReactiveFormsModule],
  templateUrl: './universites-page.html',
})
export class UniversitesPage implements OnInit {
  protected readonly service = inject(UniversiteService);
  private readonly foyerService = inject(FoyerService);
  private readonly crud = viewChild.required(CrudPage);

  protected readonly config: PageConfig<Universite> = {
    title: 'Universités',
    singular: 'une université',
    idKey: 'idUniversite',
    fields: [
      { key: 'nomUniversite', label: 'Nom', type: 'text' },
      { key: 'adresse', label: 'Adresse', type: 'text' },
    ],
    columns: [
      { label: 'Id', value: (universite) => universite.idUniversite },
      { label: 'Nom', value: (universite) => universite.nomUniversite },
      { label: 'Adresse', value: (universite) => universite.adresse },
      { label: 'Foyer', value: (universite) => universite.foyer?.nomFoyer ?? '—' },
    ],
  };

  protected readonly universites = signal<Universite[]>([]);
  protected readonly foyers = signal<Foyer[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly affectation = new FormGroup({
    nomUniversite: new FormControl<string | null>(null, Validators.required),
    idFoyer: new FormControl<number | null>(null, Validators.required),
  });
  protected readonly desaffectation = new FormControl<number | null>(null, Validators.required);

  ngOnInit(): void {
    this.loadChoices();
  }

  /** Fills the drop-down lists of the "Affecter un foyer" section. */
  protected loadChoices(): void {
    forkJoin([this.service.getAll(), this.foyerService.getAll()]).subscribe({
      next: ([universites, foyers]) => {
        this.universites.set(universites);
        this.foyers.set(foyers);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected affecter(): void {
    const { nomUniversite, idFoyer } = this.affectation.getRawValue();
    if (nomUniversite === null || idFoyer === null) {
      return;
    }
    this.run(this.service.affecterFoyer(idFoyer, nomUniversite));
    this.affectation.reset();
  }

  protected desaffecter(): void {
    const idUniversite = this.desaffectation.value;
    if (idUniversite === null) {
      return;
    }
    this.run(this.service.desaffecterFoyer(idUniversite));
    this.desaffectation.reset();
  }

  private run(request: Observable<unknown>): void {
    request.subscribe({
      next: () => {
        this.error.set(null);
        this.crud().reload();
        this.loadChoices();
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
