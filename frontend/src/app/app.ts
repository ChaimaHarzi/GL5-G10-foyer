import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Icon, NomIcone } from './shared/icon';
import { Toasts } from './shared/toast/toasts';

interface EntreeMenu {
  libelle: string;
  icone: NomIcone;
  lien: string | null;   // null = page not built yet, shown as "bientot"
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  protected readonly menu: EntreeMenu[] = [
    { libelle: 'Tableau de bord', icone: 'dashboard', lien: null },
    { libelle: 'Universités', icone: 'university', lien: '/universites' },
    { libelle: 'Foyers', icone: 'home', lien: null },
    { libelle: 'Blocs', icone: 'blocks', lien: null },
    { libelle: 'Chambres', icone: 'door', lien: null },
    { libelle: 'Étudiants', icone: 'users', lien: null },
    { libelle: 'Réservations', icone: 'calendar', lien: null }
  ];

  // Mobile only: the sidebar slides in over the page
  protected readonly menuOuvert = signal(false);

  // Title of the current page (route data "titre"), shown in the top bar
  protected readonly titrePage = toSignal(
    this.router.events.pipe(
      filter(evenement => evenement instanceof NavigationEnd),
      map(() => this.titreCourant())
    ),
    { initialValue: '' }
  );

  private titreCourant(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['titre'] ?? '';
  }
}
