import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Reservation } from '../reservations/reservation.model';
import { ReservationService } from '../reservations/reservation.service';
import { messageErreur } from '../shared/api-error';
import { age, aujourdhuiIso, dateFr } from '../shared/age';
import { couleurAvatar, initiales } from '../shared/avatar';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Etudiant } from './etudiant.model';
import { EtudiantService } from './etudiant.service';

const AGE_MINIMUM = 16;

// The back stores the CIN as a number: 01234567 comes back as 1234567, shown again on 8 digits
export function cinAffiche(cin: number): string {
  return String(cin).padStart(8, '0');
}

// A birth date must not be in the future, and the student must be at least AGE_MINIMUM years old
function dateNaissanceValide(controle: AbstractControl): ValidationErrors | null {
  const date = controle.value;
  if (!date) {
    return null;
  }
  if (date > aujourdhuiIso()) {
    return { futur: true };
  }
  return age(date) < AGE_MINIMUM ? { tropJeune: true } : null;
}

@Component({
  selector: 'app-etudiants',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './etudiants.html'
})
export class Etudiants implements OnInit {
  private readonly service = inject(EtudiantService);
  private readonly reservationService = inject(ReservationService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly etudiants = signal<Etudiant[]>([]);
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly lignesSquelette = [1, 2, 3, 4];
  protected readonly aujourdhui = aujourdhuiIso();
  protected readonly ageMinimum = AGE_MINIMUM;

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    if (!terme) {
      return this.etudiants();
    }
    return this.etudiants().filter(e =>
      `${e.prenomEtudiant} ${e.nomEtudiant}`.toLowerCase().includes(terme) || cinAffiche(e.cinEtudiant).includes(terme));
  });

  protected readonly stats = computed(() => {
    const ages = this.etudiants().flatMap(e => e.dateNaissance ? [age(e.dateNaissance)] : []);
    return {
      total: this.etudiants().length,
      ageMoyen: ages.length ? `${Math.round(ages.reduce((somme, a) => somme + a, 0) / ages.length)} ans` : '—',
      plusJeune: ages.length ? `${Math.min(...ages)} ans` : '—'
    };
  });

  // Etudiant.reservations is @JsonIgnore: the link is rebuilt from Reservation.etudiants
  protected readonly reservationsParEtudiant = computed(() => {
    const parEtudiant = new Map<number, string[]>();
    for (const reservation of this.reservations()) {
      for (const etudiant of reservation.etudiants ?? []) {
        parEtudiant.set(etudiant.idEtudiant, [...(parEtudiant.get(etudiant.idEtudiant) ?? []), reservation.idReservation]);
      }
    }
    return parEtudiant;
  });

  protected readonly formulaireOuvert = signal(false);
  protected readonly enEdition = signal<Etudiant | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = this.fb.group({
    nomEtudiant: ['', [Validators.required, Validators.maxLength(100)]],
    prenomEtudiant: ['', [Validators.required, Validators.maxLength(100)]],
    cinEtudiant: ['', [Validators.required, Validators.pattern(/^\d{8}$/), (c: AbstractControl) => this.cinDejaPris(c)]],
    dateNaissance: ['', [Validators.required, dateNaissanceValide]]
  });

  protected readonly aSupprimer = signal<Etudiant | null>(null);
  protected readonly suppression = signal(false);

  protected readonly initiales = initiales;
  protected readonly couleur = couleurAvatar;
  protected readonly cin = cinAffiche;
  protected readonly dateFr = dateFr;
  protected readonly age = age;

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    forkJoin({ etudiants: this.service.getAll(), reservations: this.reservationService.getAll() }).subscribe({
      next: ({ etudiants, reservations }) => {
        this.etudiants.set(etudiants);
        this.reservations.set(reservations);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les étudiants.'));
        this.chargement.set(false);
      }
    });
  }

  nomComplet(etudiant: Etudiant): string {
    return `${etudiant.prenomEtudiant} ${etudiant.nomEtudiant}`;
  }

  reservationsDe(etudiant: Etudiant): string[] {
    return this.reservationsParEtudiant().get(etudiant.idEtudiant) ?? [];
  }

  rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  ouvrirAjout(): void {
    this.enEdition.set(null);
    this.formulaire.reset();
    this.formulaireOuvert.set(true);
  }

  ouvrirModification(etudiant: Etudiant): void {
    this.enEdition.set(etudiant);
    this.formulaire.reset({
      nomEtudiant: etudiant.nomEtudiant,
      prenomEtudiant: etudiant.prenomEtudiant,
      cinEtudiant: cinAffiche(etudiant.cinEtudiant),
      dateNaissance: etudiant.dateNaissance ?? ''
    });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.enEdition.set(null);
  }

  champInvalide(nom: 'nomEtudiant' | 'prenomEtudiant' | 'cinEtudiant' | 'dateNaissance'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const valeurs = this.formulaire.getRawValue();
    const donnees = {
      nomEtudiant: valeurs.nomEtudiant.trim(),
      prenomEtudiant: valeurs.prenomEtudiant.trim(),
      cinEtudiant: Number(valeurs.cinEtudiant),
      dateNaissance: valeurs.dateNaissance
    };
    const edition = this.enEdition();
    const requete = edition ? this.service.update(edition.idEtudiant, donnees) : this.service.add(donnees);

    this.enregistrement.set(true);
    requete.subscribe({
      next: etudiant => {
        if (edition) {
          this.etudiants.update(liste => liste.map(e => e.idEtudiant === etudiant.idEtudiant ? etudiant : e));
          this.toasts.succes(`${this.nomComplet(etudiant)} a été modifié(e).`);
        } else {
          this.etudiants.update(liste => [...liste, etudiant]);
          this.toasts.succes(`${this.nomComplet(etudiant)} a été ajouté(e).`);
        }
        this.enregistrement.set(false);
        this.fermerFormulaire();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'enregistrer l'étudiant."));
        this.enregistrement.set(false);
      }
    });
  }

  demanderSuppression(etudiant: Etudiant): void {
    this.aSupprimer.set(etudiant);
  }

  annulerSuppression(): void {
    this.aSupprimer.set(null);
  }

  confirmerSuppression(): void {
    const etudiant = this.aSupprimer();
    if (!etudiant) {
      return;
    }
    this.suppression.set(true);
    this.service.delete(etudiant.idEtudiant).subscribe({
      next: () => {
        this.etudiants.update(liste => liste.filter(e => e.idEtudiant !== etudiant.idEtudiant));
        this.toasts.succes(`${this.nomComplet(etudiant)} a été supprimé(e).`);
        this.terminerSuppression();
      },
      error: erreur => {
        // Reservation.etudiants points to the student: the database refuses to delete a student who has reservations
        this.toasts.erreur(messageErreur(erreur, 'Impossible de supprimer cet étudiant (il a peut-être des réservations).'));
        this.terminerSuppression();
      }
    });
  }

  // Two students cannot share a CIN (the one being edited keeps its own)
  private cinDejaPris(controle: AbstractControl): ValidationErrors | null {
    const cin = Number(controle.value);
    const pris = this.etudiants().some(e => e.cinEtudiant === cin && e.idEtudiant !== this.enEdition()?.idEtudiant);
    return controle.value && pris ? { dejaPris: true } : null;
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
