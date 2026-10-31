import { HttpErrorResponse } from '@angular/common/http';
import { MESSAGE_SERVEUR_INJOIGNABLE, messageErreur } from './api-error';

describe('messageErreur', () => {
  const parDefaut = "Impossible d'enregistrer l'université.";

  it('returns the detail sent by the back (ProblemDetail)', () => {
    const erreur = new HttpErrorResponse({ status: 409, error: { title: 'Conflict', detail: 'Aucune chambre disponible' } });

    expect(messageErreur(erreur, parDefaut)).toBe('Aucune chambre disponible');
  });

  it('keeps the detail of the back even for a 500', () => {
    const erreur = new HttpErrorResponse({ status: 500, error: { detail: 'Erreur interne précise' } });

    expect(messageErreur(erreur, parDefaut)).toBe('Erreur interne précise');
  });

  it('says the server does not answer when the API is down (no detail)', () => {
    for (const status of [0, 500, 502, 503, 504]) {
      const erreur = new HttpErrorResponse({ status, error: null });

      expect(messageErreur(erreur, parDefaut)).withContext(`status ${status}`).toBe(MESSAGE_SERVEUR_INJOIGNABLE);
    }
  });

  it('falls back to the default message for other errors without detail', () => {
    expect(messageErreur(new HttpErrorResponse({ status: 400, error: null }), parDefaut)).toBe(parDefaut);
    expect(messageErreur(new Error('boom'), parDefaut)).toBe(parDefaut);
  });
});
