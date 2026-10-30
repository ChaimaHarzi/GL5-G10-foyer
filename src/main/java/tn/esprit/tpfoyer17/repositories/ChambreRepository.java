package tn.esprit.tpfoyer17.repositories;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;

import java.util.List;

@Repository
public interface ChambreRepository extends CrudRepository<Chambre,Long> {
    List<Chambre> findByBlocFoyerUniversiteNomUniversite(String nomUniversite);
    List<Chambre> findByBlocIdBlocAndTypeChambre(long idBloc, TypeChambre typeChambre);
    @Query("select c from Chambre c where c.bloc.idBloc = :idBloc and c.typeChambre = :typeChambre")
    List<Chambre> findByBlocIdBlocAndTypeChambreJPQL(long idBloc, TypeChambre typeChambre);
    // A room is free when it has no reservation for the current year
    // (rooms that were never reserved must be included too, hence "not exists" instead of a join).
    @Query("select c from Chambre c where c.bloc.idBloc = :idBloc and not exists (select r from c.reservations r where year(r.anneeUniversitaire) = year(current_date)) order by c.idChambre limit 1")
    Chambre getForReservation(long idBloc);

    Chambre findByReservationsIdReservation(String idReservation);
    @Query("select c from Chambre c where c.bloc.foyer.universite.nomUniversite = :nomUniversite and c.typeChambre = :type and not exists (select r from c.reservations r where year(r.anneeUniversitaire) = year(current_date))")
    List<Chambre> getChambresNonReserveParNomUniversiteEtTypeChambre(String nomUniversite, TypeChambre type);

    @Query("select c from Chambre c where not exists (select r from c.reservations r where year(r.anneeUniversitaire) = year(current_date))")
    List<Chambre> getChambresNonReserve();
}
