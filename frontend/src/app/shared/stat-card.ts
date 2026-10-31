import { Component, input } from '@angular/core';
import { Icon, NomIcone } from './icon';

@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  template: `
    <div class="stat-card">
      <span [class]="'stat-icone ton-' + ton()"><app-icon [nom]="icone()" [taille]="22" /></span>
      <div>
        <p class="stat-libelle">{{ libelle() }}</p>
        <p class="stat-valeur" data-test="valeur">{{ valeur() }}</p>
      </div>
    </div>
  `
})
export class StatCard {
  readonly libelle = input.required<string>();
  readonly valeur = input.required<number | string>();
  readonly icone = input.required<NomIcone>();
  readonly ton = input<'primaire' | 'succes' | 'alerte'>('primaire');
}
