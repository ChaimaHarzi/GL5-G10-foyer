import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';

/** The four operations every resource of the API exposes: getAll, add, update and delete/{id}. */
export abstract class CrudService<T> {
  protected readonly http = inject(HttpClient);

  /** Path of the resource after /api, e.g. "blocs". */
  protected abstract readonly resource: string;

  protected get baseUrl(): string {
    return `${API_URL}/${this.resource}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}/getAll`);
  }

  add(body: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/add`, body);
  }

  update(body: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/update`, body);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}
