import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NouvelleUniversite, Universite, UniversiteModifiee } from './universite.model';

// The only place that calls the universites API.
// Relative URL: the request goes to the server of the front (Angular proxy in local, Nginx on EKS),
// which forwards it to the back. No CORS, and the same build works everywhere.
@Injectable({ providedIn: 'root' })
export class UniversiteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/universites';

  getAll(): Observable<Universite[]> {
    return this.http.get<Universite[]>(`${this.baseUrl}/getAll`);
  }

  add(universite: NouvelleUniversite): Observable<Universite> {
    return this.http.post<Universite>(`${this.baseUrl}/add`, universite);
  }

  update(universite: UniversiteModifiee): Observable<Universite> {
    return this.http.put<Universite>(`${this.baseUrl}/update`, universite);
  }

  delete(idUniversite: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idUniversite}`);
  }
}
