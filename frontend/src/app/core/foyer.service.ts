import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Foyer } from './models';

@Injectable({ providedIn: 'root' })
export class FoyerService extends CrudService<Foyer> {
  protected readonly resource = 'foyers';
}
