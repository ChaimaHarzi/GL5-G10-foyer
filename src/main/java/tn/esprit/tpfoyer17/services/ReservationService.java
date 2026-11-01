package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.entities.Reservation;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.repositories.BlocRepository;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;
import tn.esprit.tpfoyer17.repositories.EtudiantRepository;
import tn.esprit.tpfoyer17.repositories.ReservationRepository;

import java.time.Year;
import java.time.ZoneId;
import java.util.*;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReservationService implements IReservationService{
    ReservationRepository reservationRepository;
    EtudiantRepository etudiantRepository;
    ChambreRepository chambreRepository;
    BlocRepository blocRepository;



    @Override
    public List<Reservation> getAllReservations() {
        return (List<Reservation>) reservationRepository.findAll();
    }

    @Override
    public Reservation getReservationById(String idReservation) {
        return reservationRepository.findById(idReservation).orElseThrow();
    }

    @Override
    public void deleteReservation(String idReservation) {
        reservationRepository.deleteById(idReservation);

    }

    @Override
    public Reservation updateReservation(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public Reservation ajouterReservation(long idBloc, long cinEtudiant) {
        Etudiant etudiant = etudiantRepository.findByCinEtudiant(cinEtudiant);
        if (etudiant == null) {
            throw new NoSuchElementException("Aucun étudiant avec le CIN " + cinEtudiant);
        }

        // A room of the bloc already reserved this year that still has a free place
        Reservation reservation = reservationRepository.findForReservation(idBloc);
        if (reservation != null) {
            reservation.getEtudiants().add(etudiant);
            Chambre chambre = chambreRepository.findByReservationsIdReservation(reservation.getIdReservation());
            TypeChambre typeChambre = chambre.getTypeChambre();
            if (typeChambre == TypeChambre.DOUBLE
                    || (typeChambre == TypeChambre.TRIPLE && reservation.getEtudiants().size() == 3)) {
                reservation.setEstValide(false);
            }
            return reservationRepository.save(reservation);
        }

        // Otherwise a new reservation in a room of the bloc not reserved this year
        Chambre chambre = chambreRepository.getForReservation(idBloc);
        if (chambre == null) {
            throw new NoSuchElementException("Aucune chambre libre dans le bloc " + idBloc);
        }
        Bloc bloc = blocRepository.findById(idBloc).orElseThrow();
        Set<Etudiant> etudiants = new HashSet<>();
        etudiants.add(etudiant);
        Reservation nouvelle = reservationRepository.save(Reservation.builder()
                .idReservation(chambre.getIdChambre() + bloc.getNomBloc() + Year.now(ZoneId.systemDefault()).getValue())
                .anneeUniversitaire(new Date())
                .estValide(chambre.getTypeChambre() != TypeChambre.SIMPLE)
                .etudiants(etudiants)
                .build());
        // Chambre owns the link (column chambre_id_chambre): without it the reservation has no room,
        // is never found again, and the next student overwrites it
        chambre.getReservations().add(nouvelle);
        chambreRepository.save(chambre);
        return nouvelle;
    }

    @Override
    public Reservation annulerReservation(long cinEtudiant) {
        Reservation reservation = reservationRepository.findByEtudiantsCinEtudiantAndAnneeUniversitaire(cinEtudiant, Year.now(ZoneId.systemDefault()).getValue());
        if (reservation == null) {
            throw new NoSuchElementException("Aucune réservation cette année pour le CIN " + cinEtudiant);
        }
        Etudiant etudiant = etudiantRepository.findByCinEtudiant(cinEtudiant);
        reservation.getEtudiants().remove(etudiant);
        reservation.setEstValide(true);
        return reservationRepository.save(reservation);
    }

    @Override
    public List<Reservation> getReservationParAnneeUniversitaireEtNomUniversite(Date anneeUniversite, String nomUniversite) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(anneeUniversite);
        return reservationRepository.findByAnneeUniversitaire_YearAndNomUnuiversite(calendar.get(Calendar.YEAR), nomUniversite);

    }
}
