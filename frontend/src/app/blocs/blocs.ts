import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Chambre } from '../chambres/chambre.model';
import { ChambreService } from '../chambres/chambre.service';
import { Foyer } from '../foyers/foyer.model';
import { FoyerService } from '../foyers/foyer.service';
import { messageErreur } from '../shared/api-error';
import { couleurAvatar, initiales } from '../shared/avatar';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Bloc } from './bloc.model';
import { BlocService } from './bloc.service';

// A chambre of the "assign" modal, with the bloc it currently belongs to
interface ChoixChambre {
  chambre: Chambre;
  blocActuel: Bloc | null;
}

@Component({
  selector: 'app-blocs',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './blocs.html'
})
export class Blocs implements OnInit {
  private readonly service = inject(BlocService);
  private readonly foyerService = inject(FoyerService);
  private readonly chambreService = inject(ChambreService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly foyers = signal<Foyer[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly lignesSquelette = [1, 2, 3, 4];

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    if (!terme) {
      return this.blocs();
    }
    return this.blocs().filter(b =>
      b.nomBloc.toLowerCase().includes(terme) || (b.foyer?.nomFoyer ?? '').toLowerCase().includes(terme));
  });

  protected readonly stats = computed(() => {
    const blocs = this.blocs();
    return {
      total: blocs.length,
      capacite: blocs.reduce((somme, b) => somme + (b.capaciteBloc ?? 0), 0),
      chambres: blocs.reduce((somme, b) => somme + this.nbChambres(b), 0)
    };
  });

  // Add / edit form
  protected readonly formulaireOuvert = signal(false);
  protected readonly enEdition = signal<Bloc | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = this.fb.group({
    nomBloc: ['', [Validators.required, Validators.maxLength(100)]],
    capaciteBloc: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    idFoyer: this.fb.control<number | null>(null)
  });

  // Deletion
  protected readonly aSupprimer = signal<Bloc | null>(null);
  protected readonly suppression = signal(false);

  // Assignment of chambres to a bloc
  protected readonly blocAffectation = signal<Bloc | null>(null);
  protected readonly choixChambres = signal<ChoixChambre[] | null>(null);
  protected readonly selection = signal<ReadonlySet<number>>(new Set());
  protected readonly affectation = signal(false);

  protected readonly initiales = initiales;
  protected readonly couleur = couleurAvatar;

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    forkJoin({ blocs: this.service.getAll(), foyers: this.foyerService.getAll() }).subscribe({
      next: ({ blocs, foyers }) => {
        this.blocs.set(blocs);
        this.foyers.set(foyers);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les blocs.'));
        this.chargement.set(false);
      }
    });
  }

  nbChambres(bloc: Bloc): number {
    return bloc.chambres?.length ?? 0;
  }

  rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  ouvrirAjout(): void {
    this.enEdition.set(null);
    this.formulaire.reset();
    this.formulaireOuvert.set(true);
  }

  ouvrirModification(bloc: Bloc): void {
    this.enEdition.set(bloc);
    this.formulaire.reset({ nomBloc: bloc.nomBloc, capaciteBloc: bloc.capaciteBloc, idFoyer: bloc.foyer?.idFoyer ?? null });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.enEdition.set(null);
  }

  champInvalide(nom: 'nomBloc' | 'capaciteBloc'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const donnees = {
      nomBloc: this.formulaire.controls.nomBloc.value.trim(),
      capaciteBloc: Number(this.formulaire.controls.capaciteBloc.value),
      idFoyer: this.formulaire.controls.idFoyer.value
    };
    const edition = this.enEdition();
    const requete = edition ? this.service.update(edition.idBloc, donnees) : this.service.add(donnees);

    this.enregistrement.set(true);
    requete.subscribe({
      next: enregistre => {
        // The answer only knows the id of the foyer: take its full data from the list already loaded
        const bloc: Bloc = {
          ...enregistre,
          foyer: this.foyers().find(f => f.idFoyer === donnees.idFoyer) ?? null,
          chambres: edition ? edition.chambres : (enregistre.chambres ?? [])
        };
        if (edition) {
          this.blocs.update(liste => liste.map(b => b.idBloc === bloc.idBloc ? bloc : b));
          this.toasts.succes(`« ${bloc.nomBloc} » a été modifié.`);
        } else {
          this.blocs.update(liste => [...liste, bloc]);
          this.toasts.succes(`« ${bloc.nomBloc} » a été ajouté.`);
        }
        this.enregistrement.set(false);
        this.fermerFormulaire();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'enregistrer le bloc."));
        this.enregistrement.set(false);
      }
    });
  }

  demanderSuppression(bloc: Bloc): void {
    this.aSupprimer.set(bloc);
  }

  annulerSuppression(): void {
    this.aSupprimer.set(null);
  }

  confirmerSuppression(): void {
    const bloc = this.aSupprimer();
    if (!bloc) {
      return;
    }
    this.suppression.set(true);
    this.service.delete(bloc.idBloc).subscribe({
      next: () => {
        this.blocs.update(liste => liste.filter(b => b.idBloc !== bloc.idBloc));
        this.toasts.succes(`« ${bloc.nomBloc} » a été supprimé.`);
        this.terminerSuppression();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de supprimer ce bloc.'));
        this.terminerSuppression();
      }
    });
  }

  ouvrirAffectation(bloc: Bloc): void {
    this.blocAffectation.set(bloc);
    this.choixChambres.set(null);
    this.selection.set(new Set());
    this.chambreService.getAll().subscribe({
      next: chambres => {
        const blocDe = (idChambre: number) => this.blocs().find(b => b.chambres?.some(c => c.idChambre === idChambre)) ?? null;
        this.choixChambres.set(chambres
          .map(chambre => ({ chambre, blocActuel: blocDe(chambre.idChambre) }))
          .sort((a, b) => a.chambre.numeroChambre - b.chambre.numeroChambre));
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de charger les chambres.'));
        this.fermerAffectation();
      }
    });
  }

  fermerAffectation(): void {
    this.blocAffectation.set(null);
    this.choixChambres.set(null);
  }

  basculer(idChambre: number): void {
    this.selection.update(actuelle => {
      const nouvelle = new Set(actuelle);
      if (nouvelle.has(idChambre)) {
        nouvelle.delete(idChambre);
      } else {
        nouvelle.add(idChambre);
      }
      return nouvelle;
    });
  }

  confirmerAffectation(): void {
    const bloc = this.blocAffectation();
    const ids = [...this.selection()];
    if (!bloc || ids.length === 0) {
      return;
    }
    this.affectation.set(true);
    this.service.affecterChambres(bloc.idBloc, ids).subscribe({
      next: () => {
        this.toasts.succes(`${ids.length} chambre(s) affectée(s) à « ${bloc.nomBloc} ».`);
        this.affectation.set(false);
        this.fermerAffectation();
        // The chambres moved between blocs: reload the blocs to show the new counts
        this.service.getAll().subscribe(blocs => this.blocs.set(blocs));
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'affecter les chambres."));
        this.affectation.set(false);
      }
    });
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
