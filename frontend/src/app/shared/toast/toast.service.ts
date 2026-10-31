import { Injectable, signal } from '@angular/core';

export type TypeToast = 'succes' | 'erreur';

export interface Toast {
  id: number;
  type: TypeToast;
  message: string;
}

// Notifications shown at the bottom right of every page; each one disappears after a few seconds
@Injectable({ providedIn: 'root' })
export class ToastService {
  static readonly DUREE_MS = 4000;

  private prochainId = 1;
  readonly toasts = signal<Toast[]>([]);

  succes(message: string): void {
    this.afficher('succes', message);
  }

  erreur(message: string): void {
    this.afficher('erreur', message);
  }

  fermer(id: number): void {
    this.toasts.update(liste => liste.filter(t => t.id !== id));
  }

  private afficher(type: TypeToast, message: string): void {
    const id = this.prochainId++;
    this.toasts.update(liste => [...liste, { id, type, message }]);
    setTimeout(() => this.fermer(id), ToastService.DUREE_MS);
  }
}
