import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage, isoDate } from './errors';

describe('errorMessage', () => {
  it('uses the detail of a ProblemDetail (404 from the API)', () => {
    const err = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { detail: 'Aucune chambre libre dans le bloc 3' },
    });
    expect(errorMessage(err)).toBe('Erreur 404 : Aucune chambre libre dans le bloc 3');
  });

  it('uses the "error" field of a Spring Boot error', () => {
    const err = new HttpErrorResponse({ status: 500, error: { error: 'Internal Server Error' } });
    expect(errorMessage(err)).toBe('Erreur 500 : Internal Server Error');
  });

  it('falls back to the status text', () => {
    const err = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
    expect(errorMessage(err)).toBe('Erreur 503 : Service Unavailable');
  });

  it('explains when the server does not answer', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toBe('Le serveur ne répond pas.');
  });

  it('handles errors that are not HTTP errors', () => {
    expect(errorMessage(new Error('boom'))).toBe('Erreur inattendue.');
  });
});

describe('isoDate', () => {
  it('keeps only the day of an ISO date', () => {
    expect(isoDate('2003-05-14T00:00:00.000+00:00')).toBe('2003-05-14');
  });

  it('returns an empty text when there is no date', () => {
    expect(isoDate(null)).toBe('');
    expect(isoDate(undefined)).toBe('');
  });
});
