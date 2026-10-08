package tn.esprit.tpfoyer17.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.tpfoyer17.entities.Etudiant;

@Repository
public interface EtudiantRepository extends CrudRepository<Etudiant,Long> {

    Etudiant findByCinEtudiant(long cinEtudiant);
}
