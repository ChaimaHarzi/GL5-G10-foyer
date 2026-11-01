import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BlocService } from '../../core/bloc.service';
import { ChambreService } from '../../core/chambre.service';
import { errorMessage } from '../../core/errors';
import { Bloc, Chambre } from '../../core/models';
import { CrudPage } from '../../shared/crud-page';
import { PageConfig } from '../../shared/page-config';

@Component({
  selector: 'app-blocs-page',
  imports: [CrudPage, ReactiveFormsModule],
  templateUrl: './blocs-page.html',
})
export class BlocsPage implements OnInit {
  protected readonly service = inject(BlocService);
  private readonly chambreService = inject(ChambreService);
  private readonly crud = viewChild.required(CrudPage);

  protected readonly config: PageConfig<Bloc> = {
    title: 'Blocs',
    singular: 'un bloc',
    idKey: 'idBloc',
    fields: [
      { key: 'nomBloc', label: 'Nom', type: 'text' },
      { key: 'capaciteBloc', label: 'Capacité', type: 'number' },
    ],
    columns: [
      { label: 'Id', value: (bloc) => bloc.idBloc },
      { label: 'Nom', value: (bloc) => bloc.nomBloc },
      { label: 'Capacité', value: (bloc) => bloc.capaciteBloc },
      { label: 'Foyer', value: (bloc) => bloc.foyer?.nomFoyer ?? '—' },
      { label: 'Chambres', value: (bloc) => numeros(bloc.chambres) },
    ],
  };

  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly chambres = signal<Chambre[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly affectation = new FormGroup({
    idBloc: new FormControl<number | null>(null, Validators.required),
    idsChambres: new FormControl<number[]>([], { nonNullable: true, validators: Validators.required }),
  });

  ngOnInit(): void {
    this.loadChoices();
  }

  /** Fills the drop-down lists of the "Ranger des chambres" section. */
  protected loadChoices(): void {
    forkJoin([this.service.getAll(), this.chambreService.getAll()]).subscribe({
      next: ([blocs, chambres]) => {
        this.blocs.set(blocs);
        this.chambres.set(chambres);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected affecter(): void {
    const { idBloc, idsChambres } = this.affectation.getRawValue();
    if (idBloc === null || idsChambres.length === 0) {
      return;
    }
    this.service.affecterChambres(idBloc, idsChambres).subscribe({
      next: () => {
        this.error.set(null);
        this.affectation.reset();
        this.crud().reload();
        this.loadChoices();
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}

function numeros(chambres: Chambre[] | undefined): string {
  return chambres?.length ? chambres.map((chambre) => chambre.numeroChambre).join(', ') : '—';
}
