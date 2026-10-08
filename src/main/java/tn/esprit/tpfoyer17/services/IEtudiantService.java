package tn.esprit.tpfoyer17.services;


import tn.esprit.tpfoyer17.entities.Etudiant;

import java.util.List;

public interface IEtudiantService {
    Etudiant addEtudiant(Etudiant etudiant);
    List<Etudiant> getAllEtudiants();
    Etudiant getEtudiantById(long idEtudiant);
    void deleteEtudiant(long idEtudiant);
    Etudiant updateEtudiant(Etudiant etudiant);
}
