import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Foyer } from '../foyers/foyer.model';
import { FoyerService } from '../foyers/foyer.service';
import { messageErreur } from '../shared/api-error';
import { couleurAvatar, initiales } from '../shared/avatar';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Universite } from './universite.model';
import { UniversiteService } from './universite.service';

// Page "Universites": statistics, search, list, add / edit in a modal, delete after confirmation,
// assign / unassign a foyer
@Component({
  selector: 'app-universites',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './universites.html',
  styleUrl: './universites.css'
})
export class Universites implements OnInit {
  private readonly service = inject(UniversiteService);
  private readonly foyerService = inject(FoyerService);
  private readonly toasts = inject(ToastService);

  protected readonly universites = signal<Universite[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly lignesSquelette = [1, 2, 3, 4];

  protected readonly filtrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    if (!terme) {
      return this.universites();
    }
    return this.universites().filter(u =>
      u.nomUniversite.toLowerCase().includes(terme) || (u.adresse ?? '').toLowerCase().includes(terme));
  });

  protected readonly stats = computed(() => {
    const liste = this.universites();
    const avecFoyer = liste.filter(u => !!u.foyer).length;
    return { total: liste.length, avecFoyer, sansFoyer: liste.length - avecFoyer };
  });

  // Add / edit form, shown in a modal
  protected readonly formulaireOuvert = signal(false);
  protected readonly enEdition = signal<Universite | null>(null);
  protected readonly enregistrement = signal(false);
  protected readonly formulaire = inject(NonNullableFormBuilder).group({
    nomUniversite: ['', [Validators.required, Validators.maxLength(100)]],
    adresse: ['', [Validators.required, Validators.maxLength(150)]]
  });

  // Deletion, after confirmation
  protected readonly aSupprimer = signal<Universite | null>(null);
  protected readonly suppression = signal(false);

  // Assign a foyer: the free foyers are loaded when the modal opens
  protected readonly aAffecter = signal<Universite | null>(null);
  protected readonly foyersLibres = signal<Foyer[] | null>(null);
  protected readonly foyerChoisi = new FormControl<number | null>(null, Validators.required);
  protected readonly affectation = signal(false);

  // Unassign the foyer, after confirmation
  protected readonly aDesaffecter = signal<Universite | null>(null);
  protected readonly desaffectation = signal(false);

  protected readonly initiales = (u: Universite) => initiales(u.nomUniversite);
  protected readonly couleur = (u: Universite) => couleurAvatar(u.nomUniversite);

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    this.service.getAll().subscribe({
      next: liste => {
        this.universites.set(liste);
        this.chargement.set(false);
      },
      error: erreur => {
        this.erreurChargement.set(messageErreur(erreur, 'Impossible de charger les universités.'));
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

  ouvrirModification(universite: Universite): void {
    this.enEdition.set(universite);
    this.formulaire.reset({ nomUniversite: universite.nomUniversite, adresse: universite.adresse ?? '' });
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.enEdition.set(null);
  }

  champInvalide(nom: 'nomUniversite' | 'adresse'): boolean {
    const champ = this.formulaire.controls[nom];
    return champ.invalid && champ.touched;
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const nomUniversite = this.formulaire.controls.nomUniversite.value.trim();
    const adresse = this.formulaire.controls.adresse.value.trim();
    const edition = this.enEdition();
    const requete = edition
      ? this.service.update({ idUniversite: edition.idUniversite, nomUniversite, adresse })
      : this.service.add({ nomUniversite, adresse });

    this.enregistrement.set(true);
    requete.subscribe({
      next: enregistree => {
        if (edition) {
          this.universites.update(liste => liste.map(u => u.idUniversite === enregistree.idUniversite ? enregistree : u));
          this.toasts.succes(`« ${enregistree.nomUniversite} » a été modifiée.`);
        } else {
          this.universites.update(liste => [...liste, enregistree]);
          this.toasts.succes(`« ${enregistree.nomUniversite} » a été ajoutée.`);
        }
        this.enregistrement.set(false);
        this.fermerFormulaire();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'enregistrer l'université."));
        this.enregistrement.set(false);
      }
    });
  }

  demanderSuppression(universite: Universite): void {
    this.aSupprimer.set(universite);
  }

  annulerSuppression(): void {
    this.aSupprimer.set(null);
  }

  confirmerSuppression(): void {
    const universite = this.aSupprimer();
    if (!universite) {
      return;
    }
    this.suppression.set(true);
    this.service.delete(universite.idUniversite).subscribe({
      next: () => {
        this.universites.update(liste => liste.filter(u => u.idUniversite !== universite.idUniversite));
        this.toasts.succes(`« ${universite.nomUniversite} » a été supprimée.`);
        this.terminerSuppression();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de supprimer cette université.'));
        this.terminerSuppression();
      }
    });
  }

  ouvrirAffectation(universite: Universite): void {
    this.aAffecter.set(universite);
    this.foyersLibres.set(null);
    this.foyerChoisi.reset(null);
    this.foyerService.getAll().subscribe({
      next: foyers => {
        // A foyer belongs to one universite only: hide the foyers already used
        const utilises = new Set(this.universites().map(u => u.foyer?.idFoyer).filter(id => id !== undefined));
        this.foyersLibres.set(foyers.filter(f => !utilises.has(f.idFoyer)));
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de charger les foyers.'));
        this.fermerAffectation();
      }
    });
  }

  fermerAffectation(): void {
    this.aAffecter.set(null);
    this.foyersLibres.set(null);
  }

  confirmerAffectation(): void {
    const universite = this.aAffecter();
    const idFoyer = this.foyerChoisi.value;
    if (!universite || idFoyer === null) {
      this.foyerChoisi.markAsTouched();
      return;
    }
    this.affectation.set(true);
    this.service.affecterFoyer(idFoyer, universite.nomUniversite).subscribe({
      next: modifiee => {
        this.universites.update(liste => liste.map(u => u.idUniversite === modifiee.idUniversite ? modifiee : u));
        this.toasts.succes(`« ${modifiee.foyer?.nomFoyer ?? 'Le foyer'} » est affecté à « ${modifiee.nomUniversite} ».`);
        this.affectation.set(false);
        this.fermerAffectation();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, "Impossible d'affecter le foyer."));
        this.affectation.set(false);
      }
    });
  }

  demanderDesaffectation(universite: Universite): void {
    this.aDesaffecter.set(universite);
  }

  annulerDesaffectation(): void {
    this.aDesaffecter.set(null);
  }

  confirmerDesaffectation(): void {
    const universite = this.aDesaffecter();
    if (!universite) {
      return;
    }
    this.desaffectation.set(true);
    this.service.desaffecterFoyer(universite.idUniversite).subscribe({
      next: modifiee => {
        this.universites.update(liste => liste.map(u => u.idUniversite === modifiee.idUniversite ? modifiee : u));
        this.toasts.succes(`Le foyer a été désaffecté de « ${modifiee.nomUniversite} ».`);
        this.terminerDesaffectation();
      },
      error: erreur => {
        this.toasts.erreur(messageErreur(erreur, 'Impossible de désaffecter le foyer.'));
        this.terminerDesaffectation();
      }
    });
  }

  private terminerDesaffectation(): void {
    this.desaffectation.set(false);
    this.aDesaffecter.set(null);
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
