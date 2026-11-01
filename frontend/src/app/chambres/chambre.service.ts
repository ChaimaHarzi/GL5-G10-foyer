import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Chambre, ChambreFormulaire } from './chambre.model';

@Injectable({ providedIn: 'root' })
export class ChambreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/chambres';

  getAll(): Observable<Chambre[]> {
    return this.http.get<Chambre[]>(`${this.baseUrl}/getAll`);
  }

  add(chambre: ChambreFormulaire): Observable<Chambre> {
    return this.http.post<Chambre>(`${this.baseUrl}/add`, chambre);
  }

  update(idChambre: number, chambre: ChambreFormulaire): Observable<Chambre> {
    return this.http.put<Chambre>(`${this.baseUrl}/update`, { idChambre, ...chambre });
  }

  delete(idChambre: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idChambre}`);
  }
}
