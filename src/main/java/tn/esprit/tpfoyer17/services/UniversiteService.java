package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.repositories.FoyerRepository;
import tn.esprit.tpfoyer17.repositories.UniversiteRepository;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UniversiteService implements IUniversiteService{
    UniversiteRepository universiteRepository;
    FoyerRepository foyerRepository;

    @Override
    public Universite addUniversite(Universite universite) {
        return universiteRepository.save(universite);
    }

    @Override
    public List<Universite> getAllUniversites() {
        return (List<Universite>) universiteRepository.findAll();
    }

    @Override
    public Universite getUniversiteById(long idUniversite) {
        return universiteRepository.findById(idUniversite).get();
    }

    @Override
    public void deleteUniversite(long idUniversite) {
        universiteRepository.deleteById(idUniversite);

    }

    @Override
    public Universite updateUniversite(Universite universite) {
        return universiteRepository.save(universite);
    }

    @Override
    public Universite affecterFoyerAUniversite(long idFoyer, String nomUniversite) {
        Universite universite = universiteRepository.findByNomUniversite(nomUniversite);
        universite.setFoyer(foyerRepository.findById(idFoyer).get());
        return universiteRepository.save(universite);
    }

    @Override
    public Universite desaffecterFoyerAUniversite(long idUniversite) {
        Universite universite = universiteRepository.findById(idUniversite).get();
        universite.setFoyer(null);
        return universiteRepository.save(universite);
    }
}
