import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Bloc } from '../blocs/bloc.model';
import { BlocService } from '../blocs/bloc.service';
import { Etudiant } from '../etudiants/etudiant.model';
import { EtudiantService } from '../etudiants/etudiant.service';
import { cinAffiche } from '../etudiants/etudiants';
import { messageErreur } from '../shared/api-error';
import { couleurAvatar, initiales } from '../shared/avatar';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { CAPACITE_TYPE, Emplacement, anneeDe, emplacementDe, placesDe } from '../shared/occupation';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Reservation } from './reservation.model';
import { ReservationService } from './reservation.service';

// A reservation with its chambre and bloc, found again from its id
interface LigneReservation {
  reservation: Reservation;
  emplacement: Emplacement | null;
  annee: number | null;
  occupants: Etudiant[];
  capacite: number | null;
}

type FiltreStatut = 'toutes' | 'libres' | 'completes';

@Component({
  selector: 'app-reservations',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './reservations.html'
})
export class Reservations implements OnInit {
  private readonly service = inject(ReservationService);
  private readonly etudiantService = inject(EtudiantService);
  private readonly blocService = inject(BlocService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  // The back counts the reservations by calendar year (year(current_date))
  protected readonly anneeCourante = new Date().getFullYear();

  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly etudiants = signal<Etudiant[]>([]);
  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly filtreStatut = signal<FiltreStatut>('toutes');
  protected readonly lignesSquelette = [1, 2, 3, 4];
  protected readonly statuts: { valeur: FiltreStatut; libelle: string }[] = [
    { valeur: 'toutes', libelle: 'Toutes' },
    { valeur: 'libres', libelle: 'Places libres' },
    { valeur: 'completes', libelle: 'Complètes' }
  ];

  protected readonly lignes = computed<LigneReservation[]>(() => this.reservations()
    .map(reservation => {
      const emplacement = emplacementDe(reservation, this.blocs());
      return {
        reservation,
        emplacement,
        annee: anneeDe(reservation.anneeUniversitaire),
        occupants: reservation.etudiants ?? [],
        capacite: emplacement ? CAPACITE_TYPE[emplacement.chambre.typeChambre] : null
      };
    })
    .sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0) || a.reservation.idReservation.localeCompare(b.reservation.idReservation)));

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const statut = this.filtreStatut();
    return this.lignes().filter(l =>
      (statut === 'toutes' || (statut === 'libres') === l.reservation.estValide) &&
      (!terme || this.texteRecherche(l).includes(terme)));
  });

  protected readonly cetteAnnee = computed(() => this.lignes().filter(l => l.annee === this.anneeCourante));

  protected readonly stats = computed(() => {
    const loges = this.cetteAnnee().reduce((somme, l) => somme + l.occupants.length, 0);
    const places = placesDe(this.blocs().flatMap(b => b.chambres ?? []));
    return { reservations: this.cetteAnnee().length, loges, placesLibres: Math.max(places - loges, 0) };
  });

  // A student can only have one reservation per year
  protected readonly etudiantsDisponibles = computed(() => {
    const loges = new Set(this.cetteAnnee().flatMap(l => l.occupants.map(e => e.idEtudiant)));
    return this.etudiants()
      .filter(e => !loges.has(e.idEtudiant))
      .sort((a, b) => this.nomComplet(a).localeCompare(this.nomComplet(b)));
  });

  // Only a bloc with chambres can receive a reservation
  protected readonly blocsReservables = computed(() => this.blocs().filter(b => (b.chambres?.length ?? 0) > 0));

  protected readonly formulaireOuvert = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = this.fb.group({
    cinEtudiant: this.fb.control<number | null>(null, Validators.required),
    idBloc: this.fb.control<number | null>(null, Validators.required)
  });

  protected readonly aAnnuler = signal<{ etudiant: Etudiant; reservation: Reservation } | null>(null);
  protected readonly annulation = signal(false);

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
      reservations: this.service.getAll(),
      etudiants: this.etudiantService.getAll(),
      blocs: this.blocService.getAll()
    }).subscribe({
      next: ({ reservations, etudiants, blocs }) => {
        this.reservations.set(reservations);
        this.etudiants.set(etudiants);
        this.blocs.set(blocs);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les réservations.'));
        this.chargement.set(false);
      }
    });
  }

  nomComplet(etudiant: Etudiant): string {
    return `${etudiant.prenomEtudiant} ${etudiant.nomEtudiant}`;
  }

  rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  filtrer(statut: FiltreStatut): void {
    this.filtreStatut.set(statut);
  }

  ouvrirAjout(): void {
    this.formulaire.reset();
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
  }

  champInvalide(nom: 'cinEtudiant' | 'idBloc'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  reserver(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const cinEtudiant = Number(this.formulaire.controls.cinEtudiant.value);
    const idBloc = Number(this.formulaire.controls.idBloc.value);
    const etudiant = this.etudiants().find(e => e.cinEtudiant === cinEtudiant);

    this.enregistrement.set(true);
    this.service.reserver(idBloc, cinEtudiant).subscribe({
      next: reservation => {
        this.toasts.succes(`Réservation ${reservation.idReservation} enregistrée pour ${etudiant ? this.nomComplet(etudiant) : 'l’étudiant'}.`);
        this.enregistrement.set(false);
        this.fermerFormulaire();
        // The back may have added the student to an existing reservation: reload the list
        this.service.getAll().subscribe(reservations => this.reservations.set(reservations));
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible d’enregistrer la réservation.'));
        this.enregistrement.set(false);
      }
    });
  }

  demanderAnnulation(etudiant: Etudiant, reservation: Reservation): void {
    this.aAnnuler.set({ etudiant, reservation });
  }

  abandonnerAnnulation(): void {
    this.aAnnuler.set(null);
  }

  confirmerAnnulation(): void {
    const choix = this.aAnnuler();
    if (!choix) {
      return;
    }
    this.annulation.set(true);
    this.service.annuler(choix.etudiant.cinEtudiant).subscribe({
      next: modifiee => {
        this.reservations.update(liste => liste.map(r => r.idReservation === modifiee.idReservation ? modifiee : r));
        this.toasts.succes(`La réservation de ${this.nomComplet(choix.etudiant)} a été annulée.`);
        this.terminerAnnulation();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible d’annuler la réservation.'));
        this.terminerAnnulation();
      }
    });
  }

  messageAnnulation(etudiant: Etudiant, reservation: Reservation): string {
    return `${this.nomComplet(etudiant)} (CIN ${cinAffiche(etudiant.cinEtudiant)}) sera retiré(e) de la réservation ${reservation.idReservation}. Sa place redevient libre.`;
  }

  private texteRecherche(ligne: LigneReservation): string {
    const etudiants = ligne.occupants.map(e => `${this.nomComplet(e)} ${cinAffiche(e.cinEtudiant)}`).join(' ');
    return `${ligne.reservation.idReservation} ${ligne.emplacement?.bloc.nomBloc ?? ''} ${etudiants}`.toLowerCase();
  }

  private terminerAnnulation(): void {
    this.annulation.set(false);
    this.aAnnuler.set(null);
  }
}
