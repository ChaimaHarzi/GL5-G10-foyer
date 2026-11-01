export type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'TRIPLE';

// JSON of a chambre: its bloc and its reservations are hidden by @JsonIgnore in the back
export interface Chambre {
  idChambre: number;
  numeroChambre: number;
  typeChambre: TypeChambre;
}
