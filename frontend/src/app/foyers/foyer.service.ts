import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Foyer, NouveauFoyer } from './foyer.model';

@Injectable({ providedIn: 'root' })
export class FoyerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/foyers';

  getAll(): Observable<Foyer[]> {
    return this.http.get<Foyer[]>(`${this.baseUrl}/getAll`);
  }

  add(foyer: NouveauFoyer): Observable<Foyer> {
    return this.http.post<Foyer>(`${this.baseUrl}/add`, foyer);
  }

  // Creates the foyer and assigns it to the universite in a single request
  ajouterEtAffecter(foyer: NouveauFoyer, idUniversite: number): Observable<Foyer> {
    return this.http.post<Foyer>(`${this.baseUrl}/ajouter-affecter`, foyer, { params: { idUniversite } });
  }

  update(foyer: Foyer): Observable<Foyer> {
    return this.http.put<Foyer>(`${this.baseUrl}/update`, foyer);
  }

  delete(idFoyer: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idFoyer}`);
  }
}
