import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Etudiant, EtudiantFormulaire } from './etudiant.model';

@Injectable({ providedIn: 'root' })
export class EtudiantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/etudiants';

  getAll(): Observable<Etudiant[]> {
    return this.http.get<Etudiant[]>(`${this.baseUrl}/getAll`);
  }

  add(etudiant: EtudiantFormulaire): Observable<Etudiant> {
    return this.http.post<Etudiant>(`${this.baseUrl}/add`, etudiant);
  }

  update(idEtudiant: number, etudiant: EtudiantFormulaire): Observable<Etudiant> {
    return this.http.put<Etudiant>(`${this.baseUrl}/update`, { idEtudiant, ...etudiant });
  }

  delete(idEtudiant: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idEtudiant}`);
  }
}
