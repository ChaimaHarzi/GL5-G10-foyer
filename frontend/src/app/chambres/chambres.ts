import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Bloc } from '../blocs/bloc.model';
import { BlocService } from '../blocs/bloc.service';
import { messageErreur } from '../shared/api-error';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Chambre, TYPES_CHAMBRE, TypeChambre } from './chambre.model';
import { ChambreService } from './chambre.service';

// A chambre with its bloc, hidden in its JSON (@JsonIgnore) and rebuilt from the blocs list
interface LigneChambre {
  chambre: Chambre;
  bloc: Bloc | null;
}

const LIBELLES_TYPE: Record<TypeChambre, string> = { SIMPLE: 'Simple', DOUBLE: 'Double', TRIPLE: 'Triple' };
const BADGES_TYPE: Record<TypeChambre, string> = { SIMPLE: 'badge-info', DOUBLE: 'badge-succes', TRIPLE: 'badge-alerte' };

@Component({
  selector: 'app-chambres',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './chambres.html'
})
export class Chambres implements OnInit {
  private readonly service = inject(ChambreService);
  private readonly blocService = inject(BlocService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly chambres = signal<Chambre[]>([]);
  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly filtreType = signal<TypeChambre | null>(null);
  protected readonly lignesSquelette = [1, 2, 3, 4];
  protected readonly types = TYPES_CHAMBRE;

  protected readonly lignes = computed<LigneChambre[]>(() => this.chambres()
    .map(chambre => ({
      chambre,
      bloc: this.blocs().find(b => b.chambres?.some(c => c.idChambre === chambre.idChambre)) ?? null
    }))
    .sort((a, b) => a.chambre.numeroChambre - b.chambre.numeroChambre));

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const type = this.filtreType();
    return this.lignes().filter(l =>
      (!type || l.chambre.typeChambre === type) &&
      (!terme || String(l.chambre.numeroChambre).includes(terme) || (l.bloc?.nomBloc ?? '').toLowerCase().includes(terme)));
  });

  protected readonly stats = computed(() => {
    const lignes = this.lignes();
    const nombre = (type: TypeChambre) => lignes.filter(l => l.chambre.typeChambre === type).length;
    return {
      total: lignes.length,
      parType: `${nombre('SIMPLE')} / ${nombre('DOUBLE')} / ${nombre('TRIPLE')}`,
      sansBloc: lignes.filter(l => !l.bloc).length
    };
  });

  protected readonly formulaireOuvert = signal(false);
  protected readonly enEdition = signal<Chambre | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = this.fb.group({
    numeroChambre: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), c => this.numeroDejaPris(c)]),
    typeChambre: this.fb.control<TypeChambre>('SIMPLE', Validators.required),
    idBloc: this.fb.control<number | null>(null)
  });

  protected readonly aSupprimer = signal<LigneChambre | null>(null);
  protected readonly suppression = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    forkJoin({ chambres: this.service.getAll(), blocs: this.blocService.getAll() }).subscribe({
      next: ({ chambres, blocs }) => {
        this.chambres.set(chambres);
        this.blocs.set(blocs);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les chambres.'));
        this.chargement.set(false);
      }
    });
  }

  libelleType(type: TypeChambre): string {
    return LIBELLES_TYPE[type];
  }

  badgeType(type: TypeChambre): string {
    return BADGES_TYPE[type];
  }

  rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  filtrer(type: TypeChambre | null): void {
    this.filtreType.set(type);
  }

  ouvrirAjout(): void {
    this.enEdition.set(null);
    this.formulaire.reset();
    this.formulaireOuvert.set(true);
  }

  ouvrirModification(chambre: Chambre): void {
    this.enEdition.set(chambre);
    this.formulaire.reset({ numeroChambre: chambre.numeroChambre, typeChambre: chambre.typeChambre, idBloc: null });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.enEdition.set(null);
  }

  champInvalide(nom: 'numeroChambre'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  enregistrer(): void {
    // The list may have changed since the number was typed: check again that it is free
    this.formulaire.controls.numeroChambre.updateValueAndValidity();
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const donnees = {
      numeroChambre: Number(this.formulaire.controls.numeroChambre.value),
      typeChambre: this.formulaire.controls.typeChambre.value
    };
    const idBloc = this.formulaire.controls.idBloc.value;
    const edition = this.enEdition();

    this.enregistrement.set(true);
    const requete: Observable<Chambre> = edition
      ? this.service.update(edition.idChambre, donnees).pipe(
          tap(chambre => this.chambres.update(liste => liste.map(c => c.idChambre === chambre.idChambre ? chambre : c))))
      : this.ajouter(donnees, idBloc);

    requete.subscribe({
      next: chambre => {
        this.toasts.succes(`La chambre ${chambre.numeroChambre} a été ${edition ? 'modifiée' : 'ajoutée'}.`);
        this.enregistrement.set(false);
        this.fermerFormulaire();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'enregistrer la chambre."));
        this.enregistrement.set(false);
      }
    });
  }

  demanderSuppression(ligne: LigneChambre): void {
    this.aSupprimer.set(ligne);
  }

  annulerSuppression(): void {
    this.aSupprimer.set(null);
  }

  confirmerSuppression(): void {
    const ligne = this.aSupprimer();
    if (!ligne) {
      return;
    }
    const { idChambre, numeroChambre } = ligne.chambre;
    this.suppression.set(true);
    this.service.delete(idChambre).subscribe({
      next: () => {
        this.chambres.update(liste => liste.filter(c => c.idChambre !== idChambre));
        this.blocs.update(liste => liste.map(b => ({ ...b, chambres: b.chambres?.filter(c => c.idChambre !== idChambre) })));
        this.toasts.succes(`La chambre ${numeroChambre} a été supprimée.`);
        this.terminerSuppression();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de supprimer cette chambre.'));
        this.terminerSuppression();
      }
    });
  }

  // ChambreDTO has no bloc: the new chambre is created first, then placed in its bloc with a second call
  private ajouter(donnees: { numeroChambre: number; typeChambre: TypeChambre }, idBloc: number | null): Observable<Chambre> {
    return this.service.add(donnees).pipe(
      tap(chambre => this.chambres.update(liste => [...liste, chambre])),
      switchMap(chambre => idBloc === null
        ? of(chambre)
        : this.blocService.affecterChambres(idBloc, [chambre.idChambre]).pipe(
            tap(() => this.blocs.update(liste => liste.map(b =>
              b.idBloc === idBloc ? { ...b, chambres: [...(b.chambres ?? []), chambre] } : b))),
            map(() => chambre)))
    );
  }

  // The number of a chambre must be unique (the one being edited keeps its own number)
  private numeroDejaPris(controle: AbstractControl): ValidationErrors | null {
    const numero = Number(controle.value);
    const pris = this.chambres().some(c => c.numeroChambre === numero && c.idChambre !== this.enEdition()?.idChambre);
    return controle.value !== null && pris ? { dejaPris: true } : null;
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
