import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Chambre } from './chambre.model';

@Injectable({ providedIn: 'root' })
export class ChambreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/tpFoyer17/api/chambres';

  getAll(): Observable<Chambre[]> {
    return this.http.get<Chambre[]>(`${this.baseUrl}/getAll`);
  }
}
