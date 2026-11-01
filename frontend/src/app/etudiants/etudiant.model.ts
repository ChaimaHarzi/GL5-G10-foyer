// JSON of an etudiant: its reservations are hidden by @JsonIgnore in the back.
// dateNaissance is a LocalDate, sent as "yyyy-MM-dd"; cinEtudiant is a long, so a leading 0 is lost
export interface Etudiant {
  idEtudiant: number;
  nomEtudiant: string;
  prenomEtudiant: string;
  cinEtudiant: number;
  dateNaissance: string | null;
}

// Body of POST /add and PUT /update (EtudiantDTO)
export interface EtudiantFormulaire {
  nomEtudiant: string;
  prenomEtudiant: string;
  cinEtudiant: number;
  dateNaissance: string;
}
