import { HttpErrorResponse } from '@angular/common/http';

/** Turns an HTTP error into a short French message for the user. */
export function errorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Erreur inattendue.';
  }
  if (err.status === 0) {
    return 'Le serveur ne répond pas.';
  }
  // 404 from the API: a ProblemDetail whose "detail" explains what was not found
  const detail = err.error?.detail ?? err.error?.error;
  return `Erreur ${err.status} : ${detail ?? err.statusText}`;
}

/** "2003-05-14T00:00:00.000+00:00" → "2003-05-14" (the format of <input type="date">). */
export function isoDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}
