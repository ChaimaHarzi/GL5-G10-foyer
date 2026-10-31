import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { messageErreur } from '../shared/api-error';
import { ConfirmDialog } from '../shared/confirm-dialog';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/modal';
import { StatCard } from '../shared/stat-card';
import { ToastService } from '../shared/toast/toast.service';
import { Universite } from './universite.model';
import { UniversiteService } from './universite.service';

const MOTS_IGNORES = new Set(['de', 'des', 'du', 'la', 'le', 'les', 'et', "d'"]);
const COULEURS_AVATAR = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

// Page "Universites": statistics, search, list, add / edit in a modal, delete after confirmation
@Component({
  selector: 'app-universites',
  imports: [ReactiveFormsModule, Icon, StatCard, Modal, ConfirmDialog],
  templateUrl: './universites.html',
  styleUrl: './universites.css'
})
export class Universites implements OnInit {
  private readonly service = inject(UniversiteService);
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

  // "Faculte des Sciences de Tunis" -> "FS", "ENIT" -> "EN"
  protected initiales(universite: Universite): string {
    const mots = universite.nomUniversite.trim().split(/\s+/).filter(m => !MOTS_IGNORES.has(m.toLowerCase()));
    const lettres = mots.length >= 2 ? mots[0][0] + mots[1][0] : (mots[0] ?? '?').slice(0, 2);
    return lettres.toUpperCase();
  }

  // Same name -> same color, on every visit
  protected couleur(universite: Universite): string {
    let hash = 0;
    for (const caractere of universite.nomUniversite) {
      hash = (hash * 31 + caractere.charCodeAt(0)) >>> 0;
    }
    return COULEURS_AVATAR[hash % COULEURS_AVATAR.length];
  }

  private terminerSuppression(): void {
    this.suppression.set(false);
    this.aSupprimer.set(null);
  }
}
