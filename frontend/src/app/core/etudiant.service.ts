import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Etudiant } from './models';

@Injectable({ providedIn: 'root' })
export class EtudiantService extends CrudService<Etudiant> {
  protected readonly resource = 'etudiants';
}
