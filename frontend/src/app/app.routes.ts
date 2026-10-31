import { Routes } from '@angular/router';
import { Universites } from './universites/universites';

export const routes: Routes = [
  { path: 'universites', component: Universites, title: 'Universités · tpFoyer', data: { titre: 'Universités' } },
  { path: '', redirectTo: 'universites', pathMatch: 'full' },
  { path: '**', redirectTo: 'universites' }
];
