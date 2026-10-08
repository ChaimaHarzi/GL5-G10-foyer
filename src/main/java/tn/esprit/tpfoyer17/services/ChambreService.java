package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChambreService implements IChambreService{
    ChambreRepository chambreRepository;

    @Override
    public Chambre addChambre(Chambre chambre) {
        return chambreRepository.save(chambre);


    }
    @Override
    public List<Chambre> getAllChambres() {
        return (List<Chambre>) chambreRepository.findAll();
    }
    @Override
    public Chambre getChambreById(long idChambre) {
        return chambreRepository.findById(idChambre).get();
    }
    @Override
    public void deleteChambre(long idChambre) {
        chambreRepository.deleteById(idChambre);
    }
    @Override
    public Chambre updateChambre(Chambre chambre) {
        return chambreRepository.save(chambre);
    }

    @Override
    public List<Chambre> getChambresParNomUniversite(String nomUniversite) {
        return chambreRepository.findByBlocFoyerUniversiteNomUniversite(nomUniversite);
    }

    @Override
    public List<Chambre> getChambresParBlocEtTypeKeyWord(long idBloc, TypeChambre typeC) {
        return chambreRepository.findByBlocIdBlocAndTypeChambre(idBloc,typeC);
    }

    @Override
    public List<Chambre> getChambresParBlocEtTypeJPQL(long idBloc, TypeChambre typeC) {
        return chambreRepository.findByBlocIdBlocAndTypeChambreJPQL(idBloc,typeC);
    }

    @Override
    public List<Chambre> getChambresNonReserveParNomUniversiteEtTypeChambre(String nomUniversite, TypeChambre type) {
        return chambreRepository.getChambresNonReserveParNomUniversiteEtTypeChambre(nomUniversite,type);
    }


    @Scheduled(cron = "*/30 * * * * * ")
    public void getChambreNonReserver(){
        log.info(chambreRepository.getChambresNonReserve().toString());
    }

}
