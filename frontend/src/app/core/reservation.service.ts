import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Reservation } from './models';

/** Reservations are not created with /add: the API picks the room itself (ajouter-reservation). */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/reservations`;

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/getAll`);
  }

  /** Books a place in the bloc for the student: joins a room with a free place, or opens a new one. */
  ajouter(idBloc: number, cinEtudiant: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/ajouter-reservation`, null, {
      params: { idBloc, cinEtudiant },
    });
  }

  /** Removes the student from their reservation of the current year. */
  annuler(cinEtudiant: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/annuler-reservation`, null, {
      params: { cinEtudiant },
    });
  }

  delete(idReservation: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idReservation}`);
  }
}
