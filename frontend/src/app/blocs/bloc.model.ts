import { Chambre } from '../chambres/chambre.model';
import { Foyer } from '../foyers/foyer.model';

// JSON of a bloc: it contains its foyer and its chambres
export interface Bloc {
  idBloc: number;
  nomBloc: string;
  capaciteBloc: number;
  foyer?: Foyer | null;
  chambres?: Chambre[] | null;
}

// Body of POST /add (BlocDTO): the foyer is given by its id only
export interface BlocFormulaire {
  nomBloc: string;
  capaciteBloc: number;
  idFoyer: number | null;
}
