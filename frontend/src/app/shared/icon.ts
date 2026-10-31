import { Component, computed, input } from '@angular/core';

// A circle written as a path, so every icon is a simple list of paths
function cercle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

// Line icons (24x24, stroke), drawn inline: no icon library to download
const ICONES = {
  dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  university: ['M22 10 12 5 2 10l10 5 10-5Z', 'M6 12v5c3 3 9 3 12 0v-5'],
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M10 21v-6h4v6'],
  blocks: ['M3 3h8v8H3z', 'M13 3h8v8h-8z', 'M3 13h8v8H3z', 'M13 13h8v8h-8z'],
  door: ['M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17', 'M3 21h18', 'M14 12h.01'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', cercle(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  calendar: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  search: [cercle(11, 11, 7), 'm21 21-4.35-4.35'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  check: [cercle(12, 12, 10), 'm9 12 2 2 4-4'],
  alert: [cercle(12, 12, 10), 'M12 8v4', 'M12 16h.01'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  refresh: ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'],
  pin: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', cercle(12, 10, 2.5)]
} as const;

export type NomIcone = keyof typeof ICONES;

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="taille()" [attr.height]="taille()" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @for (d of chemins(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: ':host { display: inline-flex; flex-shrink: 0; }'
})
export class Icon {
  readonly nom = input.required<NomIcone>();
  readonly taille = input(18);
  protected readonly chemins = computed(() => ICONES[this.nom()]);
}
