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
import java.util.NoSuchElementException;

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
        return foyerRepository.findById(idFoyer)
                .orElseThrow(() -> new NoSuchElementException("Foyer introuvable : " + idFoyer));
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
        // Checked before saving the foyer, so an unknown universite does not leave an orphan foyer
        Universite universite = universiteRepository.findById(idUniversite)
                .orElseThrow(() -> new NoSuchElementException("Universite introuvable : " + idUniversite));
        Foyer foyer1 = foyerRepository.save(foyer);
        universite.setFoyer(foyer1);
        universiteRepository.save(universite);
        return foyer1 ;
    }


}
