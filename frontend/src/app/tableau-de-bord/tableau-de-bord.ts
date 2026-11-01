import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Bloc } from '../blocs/bloc.model';
import { BlocService } from '../blocs/bloc.service';
import { Chambre, TYPES_CHAMBRE, TypeChambre } from '../chambres/chambre.model';
import { ChambreService } from '../chambres/chambre.service';
import { Etudiant } from '../etudiants/etudiant.model';
import { EtudiantService } from '../etudiants/etudiant.service';
import { cinAffiche } from '../etudiants/etudiants';
import { FoyerService } from '../foyers/foyer.service';
import { Reservation } from '../reservations/reservation.model';
import { ReservationService } from '../reservations/reservation.service';
import { messageErreur } from '../shared/api-error';
import { couleurAvatar, initiales } from '../shared/avatar';
import { Icon } from '../shared/icon';
import { anneeDe, emplacementDe, placesDe, tauxOccupation } from '../shared/occupation';
import { StatCard } from '../shared/stat-card';
import { UniversiteService } from '../universites/universite.service';

const LIBELLES_TYPE: Record<TypeChambre, string> = { SIMPLE: 'Simple', DOUBLE: 'Double', TRIPLE: 'Triple' };
const ETUDIANTS_AFFICHES = 5;

interface Barre {
  libelle: string;
  valeur: number;
  detail: string;
  largeur: number;   // % of the longest bar, or the occupation rate
}

@Component({
  selector: 'app-tableau-de-bord',
  imports: [RouterLink, Icon, StatCard],
  templateUrl: './tableau-de-bord.html'
})
export class TableauDeBord implements OnInit {
  private readonly universiteService = inject(UniversiteService);
  private readonly foyerService = inject(FoyerService);
  private readonly blocService = inject(BlocService);
  private readonly chambreService = inject(ChambreService);
  private readonly etudiantService = inject(EtudiantService);
  private readonly reservationService = inject(ReservationService);

  protected readonly anneeCourante = new Date().getFullYear();
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);

  private readonly nbUniversites = signal(0);
  private readonly nbFoyers = signal(0);
  private readonly blocs = signal<Bloc[]>([]);
  private readonly chambres = signal<Chambre[]>([]);
  private readonly etudiants = signal<Etudiant[]>([]);
  private readonly reservations = signal<Reservation[]>([]);

  private readonly reservationsAnnee = computed(() =>
    this.reservations().filter(r => anneeDe(r.anneeUniversitaire) === this.anneeCourante));

  protected readonly kpi = computed(() => ({
    universites: this.nbUniversites(),
    foyers: this.nbFoyers(),
    blocs: this.blocs().length,
    chambres: this.chambres().length,
    etudiants: this.etudiants().length,
    reservations: this.reservationsAnnee().length
  }));

  protected readonly occupation = computed(() => {
    const places = placesDe(this.chambres());
    const occupees = this.reservationsAnnee().reduce((somme, r) => somme + (r.etudiants?.length ?? 0), 0);
    return { places, occupees, taux: tauxOccupation(occupees, places) };
  });

  protected readonly parType = computed<Barre[]>(() => {
    const nombres = TYPES_CHAMBRE.map(type => this.chambres().filter(c => c.typeChambre === type).length);
    const max = Math.max(...nombres, 1);
    return TYPES_CHAMBRE.map((type, i) => ({
      libelle: LIBELLES_TYPE[type],
      valeur: nombres[i],
      detail: `${nombres[i]} chambre(s) ${LIBELLES_TYPE[type].toLowerCase()}(s)`,
      largeur: Math.round((nombres[i] / max) * 100)
    }));
  });

  protected readonly parBloc = computed<Barre[]>(() => {
    const occupeesParBloc = new Map<number, number>();
    for (const reservation of this.reservationsAnnee()) {
      const emplacement = emplacementDe(reservation, this.blocs());
      if (emplacement) {
        const id = emplacement.bloc.idBloc;
        occupeesParBloc.set(id, (occupeesParBloc.get(id) ?? 0) + (reservation.etudiants?.length ?? 0));
      }
    }
    return this.blocs()
      .filter(b => (b.chambres?.length ?? 0) > 0)
      .map(b => {
        const places = placesDe(b.chambres ?? []);
        const occupees = occupeesParBloc.get(b.idBloc) ?? 0;
        const taux = tauxOccupation(occupees, places);
        return { libelle: b.nomBloc, valeur: taux, detail: `${occupees}/${places} places occupées`, largeur: taux };
      });
  });

  protected readonly sansReservation = computed(() => {
    const loges = new Set(this.reservationsAnnee().flatMap(r => (r.etudiants ?? []).map(e => e.idEtudiant)));
    return this.etudiants().filter(e => !loges.has(e.idEtudiant));
  });
  protected readonly etudiantsAffiches = computed(() => this.sansReservation().slice(0, ETUDIANTS_AFFICHES));

  protected readonly initiales = initiales;
  protected readonly couleur = couleurAvatar;
  protected readonly cin = cinAffiche;

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    forkJoin({
      universites: this.universiteService.getAll(),
      foyers: this.foyerService.getAll(),
      blocs: this.blocService.getAll(),
      chambres: this.chambreService.getAll(),
      etudiants: this.etudiantService.getAll(),
      reservations: this.reservationService.getAll()
    }).subscribe({
      next: donnees => {
        this.nbUniversites.set(donnees.universites.length);
        this.nbFoyers.set(donnees.foyers.length);
        this.blocs.set(donnees.blocs);
        this.chambres.set(donnees.chambres);
        this.etudiants.set(donnees.etudiants);
        this.reservations.set(donnees.reservations);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger le tableau de bord.'));
        this.chargement.set(false);
      }
    });
  }

  nomComplet(etudiant: Etudiant): string {
    return `${etudiant.prenomEtudiant} ${etudiant.nomEtudiant}`;
  }
}
