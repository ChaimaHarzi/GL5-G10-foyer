package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.repositories.FoyerRepository;
import tn.esprit.tpfoyer17.repositories.UniversiteRepository;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FoyerService implements IFoyerService{
    FoyerRepository foyerRepository;
    UniversiteRepository universiteRepository;

    @Override
    public Foyer addFoyer(Foyer foyer) {
        return foyerRepository.save(foyer);


    }
    @Override
    public List<Foyer> getAllFoyers() {
        return (List<Foyer>) foyerRepository.findAll();
    }
    @Override
    public Foyer getFoyerById(long idFoyer) {
        return foyerRepository.findById(idFoyer).get();
    }
    @Override
    public void deleteFoyer(long idFoyer) {
        foyerRepository.deleteById(idFoyer);
    }
    @Override
    public Foyer updateFoyer(Foyer foyer) {
        return foyerRepository.save(foyer);
    }

    @Override
    public Foyer ajouterFoyerEtAffecterAUniversite(Foyer foyer, long idUniversite) {
        Foyer foyer1 = foyerRepository.save(foyer);
        Universite universite = universiteRepository.findById(idUniversite).get();
        universite.setFoyer(foyer1);
        universiteRepository.save(universite);
        return foyer1 ;
    }


}
