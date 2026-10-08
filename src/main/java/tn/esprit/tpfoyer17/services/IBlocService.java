package tn.esprit.tpfoyer17.services;


import tn.esprit.tpfoyer17.entities.Bloc;

import java.util.List;

public interface IBlocService {
    Bloc addBloc(Bloc bloc);
    List<Bloc> getAllBlocs();
    Bloc getBlocById(long idBloc);
    void deleteBloc(long idBloc);
    Bloc updateBloc(Bloc bloc);

    Bloc affecterChambresABloc(List<Long> numChambre, long idBloc) ;



}
