package tn.esprit.tpfoyer17.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.tpfoyer17.entities.Bloc;

import java.util.List;

@Repository
public interface BlocRepository extends CrudRepository<Bloc,Long> {
    List<Bloc> findByFoyerUniversiteIdUniversite(long idUniversite);
}
