package tn.esprit.tpfoyer17.services;


import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;

import java.util.List;

public interface IChambreService {
    Chambre addChambre(Chambre chambre);
    List<Chambre> getAllChambres();
    Chambre getChambreById(long idChambre);
    void deleteChambre(long idChambre);
    Chambre updateChambre(Chambre chambre);
    List<Chambre>  getChambresParNomUniversite( String nomUniversite) ;
    List<Chambre> getChambresParBlocEtTypeKeyWord(long idBloc, TypeChambre typeC) ;
    List<Chambre> getChambresParBlocEtTypeJPQL(long idBloc, TypeChambre typeC) ;
    List<Chambre>  getChambresNonReserveParNomUniversiteEtTypeChambre( String nomUniversite,TypeChambre type) ;
}
