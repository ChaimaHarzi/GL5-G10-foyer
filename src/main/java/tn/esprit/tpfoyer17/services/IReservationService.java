package tn.esprit.tpfoyer17.services;


import tn.esprit.tpfoyer17.entities.Reservation;

import java.util.Date;
import java.util.List;

public interface IReservationService {
    List<Reservation> getAllReservations();
    Reservation getReservationById(String idReservation);
    void deleteReservation(String idReservation);
    Reservation updateReservation(Reservation reservation);
    Reservation ajouterReservation (long idChambre, long cinEtudiant) ;
    Reservation annulerReservation (long cinEtudiant) ;

    List<Reservation>  getReservationParAnneeUniversitaireEtNomUniversite(Date anneeUniversite, String nomUniversite);
}
