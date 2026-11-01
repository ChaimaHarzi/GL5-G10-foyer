import { Routes } from '@angular/router';
import { Blocs } from './blocs/blocs';
import { Chambres } from './chambres/chambres';
import { Etudiants } from './etudiants/etudiants';
import { Foyers } from './foyers/foyers';
import { Reservations } from './reservations/reservations';
import { TableauDeBord } from './tableau-de-bord/tableau-de-bord';
import { Universites } from './universites/universites';

export const routes: Routes = [
  { path: 'tableau-de-bord', component: TableauDeBord, title: 'Tableau de bord · tpFoyer', data: { titre: 'Tableau de bord' } },
  { path: 'universites', component: Universites, title: 'Universités · tpFoyer', data: { titre: 'Universités' } },
  { path: 'foyers', component: Foyers, title: 'Foyers · tpFoyer', data: { titre: 'Foyers' } },
  { path: 'blocs', component: Blocs, title: 'Blocs · tpFoyer', data: { titre: 'Blocs' } },
  { path: 'chambres', component: Chambres, title: 'Chambres · tpFoyer', data: { titre: 'Chambres' } },
  { path: 'etudiants', component: Etudiants, title: 'Étudiants · tpFoyer', data: { titre: 'Étudiants' } },
  { path: 'reservations', component: Reservations, title: 'Réservations · tpFoyer', data: { titre: 'Réservations' } },
  { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
  { path: '**', redirectTo: 'tableau-de-bord' }
];
