// JSON returned by the Spring Boot API (fields hidden with @JsonIgnore are not listed).

export type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'TRIPLE';

export const TYPES_CHAMBRE: readonly TypeChambre[] = ['SIMPLE', 'DOUBLE', 'TRIPLE'];

export interface Foyer {
  idFoyer: number;
  nomFoyer: string;
  capaciteFoyer: number;
}

export interface Universite {
  idUniversite: number;
  nomUniversite: string;
  adresse: string;
  foyer?: Foyer | null;
}

export interface Chambre {
  idChambre: number;
  numeroChambre: number;
  typeChambre: TypeChambre;
}

export interface Bloc {
  idBloc: number;
  nomBloc: string;
  capaciteBloc: number;
  foyer?: Foyer | null;
  chambres?: Chambre[];
}

export interface Etudiant {
  idEtudiant: number;
  nomEtudiant: string;
  prenomEtudiant: string;
  cinEtudiant: number;
  /** ISO date sent by the API, e.g. "2003-05-14T00:00:00.000+00:00" */
  dateNaissance: string | null;
}

export interface Reservation {
  idReservation: string;
  anneeUniversitaire: string | null;
  /** true while the room still has a free place, false once it is full */
  estValide: boolean;
  etudiants: Etudiant[];
}
