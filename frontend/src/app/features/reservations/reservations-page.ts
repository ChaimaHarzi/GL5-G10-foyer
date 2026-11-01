import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { BlocService } from '../../core/bloc.service';
import { errorMessage } from '../../core/errors';
import { EtudiantService } from '../../core/etudiant.service';
import { Bloc, Etudiant, Reservation } from '../../core/models';
import { ReservationService } from '../../core/reservation.service';

@Component({
  selector: 'app-reservations-page',
  imports: [ReactiveFormsModule],
  templateUrl: './reservations-page.html',
})
export class ReservationsPage implements OnInit {
  private readonly service = inject(ReservationService);
  private readonly blocService = inject(BlocService);
  private readonly etudiantService = inject(EtudiantService);

  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly etudiants = signal<Etudiant[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly ajout = new FormGroup({
    idBloc: new FormControl<number | null>(null, Validators.required),
    cinEtudiant: new FormControl<number | null>(null, Validators.required),
  });
  protected readonly annulation = new FormControl<number | null>(null, Validators.required);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    forkJoin([this.service.getAll(), this.blocService.getAll(), this.etudiantService.getAll()]).subscribe({
      next: ([reservations, blocs, etudiants]) => {
        this.reservations.set(reservations);
        this.blocs.set(blocs);
        this.etudiants.set(etudiants);
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected ajouter(): void {
    const { idBloc, cinEtudiant } = this.ajout.getRawValue();
    if (idBloc === null || cinEtudiant === null) {
      return;
    }
    this.run(this.service.ajouter(idBloc, cinEtudiant), (r) => `Réservation ${r.idReservation} enregistrée.`);
    this.ajout.reset();
  }

  protected annuler(): void {
    const cinEtudiant = this.annulation.value;
    if (cinEtudiant === null) {
      return;
    }
    this.run(this.service.annuler(cinEtudiant), (r) => `L’étudiant a été retiré de la réservation ${r.idReservation}.`);
    this.annulation.reset();
  }

  protected supprimer(reservation: Reservation): void {
    if (!confirm(`Supprimer la réservation ${reservation.idReservation} ?`)) {
      return;
    }
    this.run(this.service.delete(reservation.idReservation), () => 'Réservation supprimée.');
  }

  protected occupants(reservation: Reservation): string {
    const noms = reservation.etudiants.map((e) => `${e.prenomEtudiant} ${e.nomEtudiant} (${e.cinEtudiant})`);
    return noms.length ? noms.join(', ') : '—';
  }

  protected annee(reservation: Reservation): string {
    return reservation.anneeUniversitaire ? reservation.anneeUniversitaire.slice(0, 4) : '—';
  }

  private run<R>(request: Observable<R>, success: (result: R) => string): void {
    request.subscribe({
      next: (result) => {
        this.error.set(null);
        this.message.set(success(result));
        this.load();
      },
      error: (err) => {
        this.message.set(null);
        this.error.set(errorMessage(err));
      },
    });
  }
}
