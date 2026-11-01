import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Bloc, BlocFormulaire } from './bloc.model';

@Injectable({ providedIn: 'root' })
export class BlocService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/blocs';

  getAll(): Observable<Bloc[]> {
    return this.http.get<Bloc[]>(`${this.baseUrl}/getAll`);
  }

  add(bloc: BlocFormulaire): Observable<Bloc> {
    return this.http.post<Bloc>(`${this.baseUrl}/add`, bloc);
  }

  update(idBloc: number, bloc: BlocFormulaire): Observable<Bloc> {
    return this.http.put<Bloc>(`${this.baseUrl}/update`, { idBloc, ...bloc });
  }

  delete(idBloc: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idBloc}`);
  }

  // The back looks the chambres up by id (chambreRepository.findAllById), although the parameter is named "numChambre"
  affecterChambres(idBloc: number, idsChambres: number[]): Observable<Bloc> {
    return this.http.put<Bloc>(`${this.baseUrl}/affecter-chambre-bloc`, idsChambres, { params: { idBloc } });
  }
}
