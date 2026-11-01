import { Routes } from '@angular/router';

// Each page is loaded only when it is opened (lazy loading): the first download stays small.
export const routes: Routes = [
  {
    path: '',
    title: 'tpFoyer',
    loadComponent: () => import('./features/accueil/accueil-page').then((m) => m.AccueilPage),
  },
  {
    path: 'universites',
    title: 'Universités · tpFoyer',
    loadComponent: () => import('./features/universites/universites-page').then((m) => m.UniversitesPage),
  },
  {
    path: 'foyers',
    title: 'Foyers · tpFoyer',
    loadComponent: () => import('./features/foyers/foyers-page').then((m) => m.FoyersPage),
  },
  {
    path: 'blocs',
    title: 'Blocs · tpFoyer',
    loadComponent: () => import('./features/blocs/blocs-page').then((m) => m.BlocsPage),
  },
  {
    path: 'chambres',
    title: 'Chambres · tpFoyer',
    loadComponent: () => import('./features/chambres/chambres-page').then((m) => m.ChambresPage),
  },
  {
    path: 'etudiants',
    title: 'Étudiants · tpFoyer',
    loadComponent: () => import('./features/etudiants/etudiants-page').then((m) => m.EtudiantsPage),
  },
  {
    path: 'reservations',
    title: 'Réservations · tpFoyer',
    loadComponent: () => import('./features/reservations/reservations-page').then((m) => m.ReservationsPage),
  },
  { path: '**', redirectTo: '' },
];
