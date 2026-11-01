import { Routes } from '@angular/router';
import { Blocs } from './blocs/blocs';
import { Chambres } from './chambres/chambres';
import { Etudiants } from './etudiants/etudiants';
import { Foyers } from './foyers/foyers';
import { Universites } from './universites/universites';

export const routes: Routes = [
  { path: 'universites', component: Universites, title: 'Universités · tpFoyer', data: { titre: 'Universités' } },
  { path: 'foyers', component: Foyers, title: 'Foyers · tpFoyer', data: { titre: 'Foyers' } },
  { path: 'blocs', component: Blocs, title: 'Blocs · tpFoyer', data: { titre: 'Blocs' } },
  { path: 'chambres', component: Chambres, title: 'Chambres · tpFoyer', data: { titre: 'Chambres' } },
  { path: 'etudiants', component: Etudiants, title: 'Étudiants · tpFoyer', data: { titre: 'Étudiants' } },
  { path: '', redirectTo: 'universites', pathMatch: 'full' },
  { path: '**', redirectTo: 'universites' }
];
