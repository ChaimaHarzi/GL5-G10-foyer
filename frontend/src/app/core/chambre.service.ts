import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Chambre } from './models';

@Injectable({ providedIn: 'root' })
export class ChambreService extends CrudService<Chambre> {
  protected readonly resource = 'chambres';
}
