import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Universite } from './models';

@Injectable({ providedIn: 'root' })
export class UniversiteService extends CrudService<Universite> {
  protected readonly resource = 'universites';

  affecterFoyer(idFoyer: number, nomUniversite: string): Observable<Universite> {
    return this.http.put<Universite>(`${this.baseUrl}/affecter-foyer-universite`, null, {
      params: { idFoyer, nomUniversite },
    });
  }

  desaffecterFoyer(idUniversite: number): Observable<Universite> {
    return this.http.put<Universite>(`${this.baseUrl}/desaffecter-foyer-universite`, null, {
      params: { idUniversite },
    });
  }
}
