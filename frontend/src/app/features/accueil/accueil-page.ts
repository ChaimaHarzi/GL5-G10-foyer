import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { BlocService } from '../../core/bloc.service';
import { ChambreService } from '../../core/chambre.service';
import { EtudiantService } from '../../core/etudiant.service';
import { FoyerService } from '../../core/foyer.service';
import { ReservationService } from '../../core/reservation.service';
import { UniversiteService } from '../../core/universite.service';

interface Stat {
  label: string;
  path: string;
  /** null while loading, or when the API did not answer */
  count: number | null;
}

const STATS: Stat[] = [
  { label: 'Universités', path: '/universites', count: null },
  { label: 'Foyers', path: '/foyers', count: null },
  { label: 'Blocs', path: '/blocs', count: null },
  { label: 'Chambres', path: '/chambres', count: null },
  { label: 'Étudiants', path: '/etudiants', count: null },
  { label: 'Réservations', path: '/reservations', count: null },
];

@Component({
  selector: 'app-accueil-page',
  imports: [RouterLink],
  templateUrl: './accueil-page.html',
})
export class AccueilPage implements OnInit {
  private readonly universites = inject(UniversiteService);
  private readonly foyers = inject(FoyerService);
  private readonly blocs = inject(BlocService);
  private readonly chambres = inject(ChambreService);
  private readonly etudiants = inject(EtudiantService);
  private readonly reservations = inject(ReservationService);

  protected readonly stats = signal<Stat[]>(STATS);

  ngOnInit(): void {
    // One failing resource must not hide the counts of the others
    const count = (list: Observable<unknown[]>) =>
      list.pipe(
        map((items) => items.length),
        catchError(() => of(null)),
      );
    forkJoin([
      count(this.universites.getAll()),
      count(this.foyers.getAll()),
      count(this.blocs.getAll()),
      count(this.chambres.getAll()),
      count(this.etudiants.getAll()),
      count(this.reservations.getAll()),
    ]).subscribe((counts) => this.stats.set(STATS.map((stat, i) => ({ ...stat, count: counts[i] }))));
  }
}
