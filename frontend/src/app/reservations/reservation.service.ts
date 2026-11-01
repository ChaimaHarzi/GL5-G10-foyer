import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from './reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/reservations';

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/getAll`);
  }

  // The back names the parameter "idChambre" but reads a bloc id: it picks the chambre of the bloc itself
  reserver(idBloc: number, cinEtudiant: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/ajouter-reservation`, null, { params: { idChambre: idBloc, cinEtudiant } });
  }

  // Removes the student from his reservation of the current year, which gets free places again
  annuler(cinEtudiant: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/annuler-reservation`, null, { params: { cinEtudiant } });
  }
}
