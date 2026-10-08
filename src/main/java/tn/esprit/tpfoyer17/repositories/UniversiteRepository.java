package tn.esprit.tpfoyer17.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.tpfoyer17.entities.Universite;

@Repository
public interface UniversiteRepository extends CrudRepository<Universite,Long> {
    Universite findByNomUniversite(String nomUniversite);
}
