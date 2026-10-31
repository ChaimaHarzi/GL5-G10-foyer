import { HttpErrorResponse } from '@angular/common/http';

export const MESSAGE_SERVEUR_INJOIGNABLE = "Le serveur ne répond pas. Vérifiez que l'API est démarrée.";

// Status codes sent when the API cannot be reached: by the browser (0), the Angular proxy (500) or Nginx (502, 503, 504)
const STATUTS_SERVEUR_INJOIGNABLE = new Set([0, 500, 502, 503, 504]);

/**
 * Message to show to the user for a failed API call.
 * The back answers its errors as ProblemDetail (GlobalExceptionHandler): its "detail" field is the real reason,
 * so it is always shown when present.
 */
export function messageErreur(erreur: unknown, parDefaut: string): string {
  if (erreur instanceof HttpErrorResponse) {
    const detail = (erreur.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (STATUTS_SERVEUR_INJOIGNABLE.has(erreur.status)) {
      return MESSAGE_SERVEUR_INJOIGNABLE;
    }
  }
  return parDefaut;
}
