// JSON of a foyer: its universite and its blocs are hidden by @JsonIgnore in the back
export interface Foyer {
  idFoyer: number;
  nomFoyer: string;
  capaciteFoyer: number;
}

// Body of POST /add and /ajouter-affecter (FoyerDTO without id)
export type NouveauFoyer = Pick<Foyer, 'nomFoyer' | 'capaciteFoyer'>;
