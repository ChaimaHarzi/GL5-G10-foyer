export type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'TRIPLE';

export const TYPES_CHAMBRE: readonly TypeChambre[] = ['SIMPLE', 'DOUBLE', 'TRIPLE'];

// JSON of a chambre: its bloc and its reservations are hidden by @JsonIgnore in the back
export interface Chambre {
  idChambre: number;
  numeroChambre: number;
  typeChambre: TypeChambre;
}

// Body of POST /add and PUT /update (ChambreDTO): the bloc is assigned with /api/blocs/affecter-chambre-bloc
export interface ChambreFormulaire {
  numeroChambre: number;
  typeChambre: TypeChambre;
}
