import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly links = [
    { path: '/', label: 'Accueil' },
    { path: '/universites', label: 'Universités' },
    { path: '/foyers', label: 'Foyers' },
    { path: '/blocs', label: 'Blocs' },
    { path: '/chambres', label: 'Chambres' },
    { path: '/etudiants', label: 'Étudiants' },
    { path: '/reservations', label: 'Réservations' },
  ];
}
