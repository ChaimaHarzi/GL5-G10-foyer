package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.repositories.BlocRepository;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlocService implements IBlocService{
    BlocRepository blocRepository;
    ChambreRepository chambreRepository;


    @Override
    public Bloc addBloc(Bloc bloc) {
        return blocRepository.save(bloc);


    }
    @Override
    public List<Bloc> getAllBlocs() {
        return (List<Bloc>) blocRepository.findAll();
    }
    @Override
    public Bloc getBlocById(long idBloc) {
        return blocRepository.findById(idBloc).get();
    }
    @Override
    public void deleteBloc(long idBloc) {
         blocRepository.deleteById(idBloc);
    }
    @Override
    public Bloc updateBloc(Bloc bloc) {
        return blocRepository.save(bloc);
    }

    @Override
    public Bloc affecterChambresABloc(List<Long> numChambre, long idBloc) {
        Bloc bloc = blocRepository.findById(idBloc).get();
        List<Chambre> chambres = (List<Chambre>) chambreRepository.findAllById(numChambre);
        for (Chambre chambre: chambres) {
            chambre.setBloc(bloc);
            blocRepository.save(bloc);
        }
        return bloc;
    }

}
