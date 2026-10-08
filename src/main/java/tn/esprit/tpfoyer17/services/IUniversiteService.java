package tn.esprit.tpfoyer17.services;

import tn.esprit.tpfoyer17.entities.Universite;

import java.util.List;

public interface IUniversiteService {
    Universite addUniversite(Universite universite);
    List<Universite> getAllUniversites();
    Universite getUniversiteById(long idUniversite);
    void deleteUniversite(long idUniversite);
    Universite updateUniversite(Universite universite);
    Universite affecterFoyerAUniversite (long idFoyer, String nomUniversite) ;
    Universite desaffecterFoyerAUniversite (long idUniversite) ;
}
