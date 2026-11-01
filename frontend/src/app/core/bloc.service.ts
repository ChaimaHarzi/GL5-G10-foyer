import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Bloc } from './models';

@Injectable({ providedIn: 'root' })
export class BlocService extends CrudService<Bloc> {
  protected readonly resource = 'blocs';

  /** Puts the given rooms (by id) in the bloc. */
  affecterChambres(idBloc: number, idsChambres: number[]): Observable<Bloc> {
    return this.http.put<Bloc>(`${this.baseUrl}/affecter-chambre-bloc`, idsChambres, {
      params: { idBloc },
    });
  }
}
