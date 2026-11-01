import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Bloc } from '../blocs/bloc.model';
import { BlocService } from '../blocs/bloc.service';
import { messageErreur } from '../shared/api-error';
import { couleurAvatar, initiales } from '../shared/avatar';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Universite } from '../universites/universite.model';
import { UniversiteService } from '../universites/universite.service';
import { Foyer } from './foyer.model';
import { FoyerService } from './foyer.service';

// A foyer with the links hidden in its JSON (@JsonIgnore), rebuilt from the universites and blocs lists
interface LigneFoyer {
  foyer: Foyer;
  universite: Universite | null;
  nbBlocs: number;
}

@Component({
  selector: 'app-foyers',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './foyers.html'
})
export class Foyers implements OnInit {
  private readonly service = inject(FoyerService);
  private readonly universiteService = inject(UniversiteService);
  private readonly blocService = inject(BlocService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly foyers = signal<Foyer[]>([]);
  protected readonly universites = signal<Universite[]>([]);
  protected readonly blocs = signal<Bloc[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly lignesSquelette = [1, 2, 3, 4];

  protected readonly lignes = computed<LigneFoyer[]>(() => this.foyers().map(foyer => ({
    foyer,
    universite: this.universites().find(u => u.foyer?.idFoyer === foyer.idFoyer) ?? null,
    nbBlocs: this.blocs().filter(b => b.foyer?.idFoyer === foyer.idFoyer).length
  })));

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    if (!terme) {
      return this.lignes();
    }
    return this.lignes().filter(l =>
      l.foyer.nomFoyer.toLowerCase().includes(terme) || (l.universite?.nomUniversite ?? '').toLowerCase().includes(terme));
  });

  protected readonly stats = computed(() => {
    const lignes = this.lignes();
    return {
      total: lignes.length,
      capacite: lignes.reduce((somme, l) => somme + (l.foyer.capaciteFoyer ?? 0), 0),
      affectes: lignes.filter(l => !!l.universite).length
    };
  });

  // Only a universite without foyer can receive a new one
  protected readonly universitesSansFoyer = computed(() => this.universites().filter(u => !u.foyer));

  protected readonly formulaireOuvert = signal(false);
  protected readonly enEdition = signal<Foyer | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = this.fb.group({
    nomFoyer: ['', [Validators.required, Validators.maxLength(100)]],
    capaciteFoyer: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    idUniversite: this.fb.control<number | null>(null)
  });

  protected readonly aSupprimer = signal<LigneFoyer | null>(null);
  protected readonly suppression = signal(false);

  protected readonly initiales = initiales;
  protected readonly couleur = couleurAvatar;

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    forkJoin({
      foyers: this.service.getAll(),
      universites: this.universiteService.getAll(),
      blocs: this.blocService.getAll()
    }).subscribe({
      next: ({ foyers, universites, blocs }) => {
        this.foyers.set(foyers);
        this.universites.set(universites);
        this.blocs.set(blocs);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les foyers.'));
        this.chargement.set(false);
      }
    });
  }

  rechercher(evenement: Event): void {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  ouvrirAjout(): void {
    this.enEdition.set(null);
    this.formulaire.reset();
    this.formulaireOuvert.set(true);
  }

  ouvrirModification(foyer: Foyer): void {
    this.enEdition.set(foyer);
    this.formulaire.reset({ nomFoyer: foyer.nomFoyer, capaciteFoyer: foyer.capaciteFoyer, idUniversite: null });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.enEdition.set(null);
  }

  champInvalide(nom: 'nomFoyer' | 'capaciteFoyer'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const nomFoyer = this.formulaire.controls.nomFoyer.value.trim();
    const capaciteFoyer = Number(this.formulaire.controls.capaciteFoyer.value);
    const idUniversite = this.formulaire.controls.idUniversite.value;
    const edition = this.enEdition();

    const requete = edition
      ? this.service.update({ idFoyer: edition.idFoyer, nomFoyer, capaciteFoyer })
      : idUniversite
        ? this.service.ajouterEtAffecter({ nomFoyer, capaciteFoyer }, idUniversite)
        : this.service.add({ nomFoyer, capaciteFoyer });

    this.enregistrement.set(true);
    requete.subscribe({
      next: enregistre => {
        if (edition) {
          this.foyers.update(liste => liste.map(f => f.idFoyer === enregistre.idFoyer ? enregistre : f));
          // The universites embed their foyer: keep the copy shown in the table up to date
          this.universites.update(liste => liste.map(u => u.foyer?.idFoyer === enregistre.idFoyer ? { ...u, foyer: enregistre } : u));
          this.toasts.succes(`« ${enregistre.nomFoyer} » a été modifié.`);
        } else {
          this.foyers.update(liste => [...liste, enregistre]);
          if (idUniversite) {
            this.universites.update(liste => liste.map(u => u.idUniversite === idUniversite ? { ...u, foyer: enregistre } : u));
          }
          this.toasts.succes(`« ${enregistre.nomFoyer} » a été ajouté.`);
        }
        this.enregistrement.set(false);
        this.fermerFormulaire();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'enregistrer le foyer."));
        this.enregistrement.set(false);
      }
    });
  }

  demanderSuppression(ligne: LigneFoyer): void {
    this.aSupprimer.set(ligne);
  }

  annulerSuppression(): void {
    this.aSupprimer.set(null);
  }

  messageSuppression(ligne: LigneFoyer): string {
    const blocs = ligne.nbBlocs > 0 ? ` Ses ${ligne.nbBlocs} bloc(s) seront aussi supprimés.` : '';
    return `« ${ligne.foyer.nomFoyer} » sera définitivement supprimé.${blocs} Cette action est irréversible.`;
  }

  confirmerSuppression(): void {
    const ligne = this.aSupprimer();
    if (!ligne) {
      return;
    }
    const idFoyer = ligne.foyer.idFoyer;
    this.suppression.set(true);
    this.service.delete(idFoyer).subscribe({
      next: () => {
        this.foyers.update(liste => liste.filter(f => f.idFoyer !== idFoyer));
        // Foyer.blocs is cascade = ALL: the back deleted its blocs too
        this.blocs.update(liste => liste.filter(b => b.foyer?.idFoyer !== idFoyer));
        this.toasts.succes(`« ${ligne.foyer.nomFoyer} » a été supprimé.`);
        this.terminerSuppression();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de supprimer ce foyer (ses blocs contiennent peut-être des chambres).'));
        this.terminerSuppression();
      }
    });
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
