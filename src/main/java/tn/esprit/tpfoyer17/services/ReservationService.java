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
        return reservationRepository.findById(idReservation)
                .orElseThrow(() -> new NoSuchElementException("Reservation introuvable : " + idReservation));
    }

    private Etudiant getEtudiantByCin(long cinEtudiant) {
        Etudiant etudiant = etudiantRepository.findByCinEtudiant(cinEtudiant);
        if (etudiant == null) {
            throw new NoSuchElementException("Etudiant introuvable : CIN " + cinEtudiant);
        }
        return etudiant;
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

        Etudiant etudiant = getEtudiantByCin(cinEtudiant);
        // One reservation per student and per year
        if (reservationRepository.findByEtudiantsCinEtudiantAndAnneeUniversitaire(cinEtudiant, Year.now().getValue()) != null) {
            throw new IllegalStateException("L'etudiant CIN " + cinEtudiant + " a deja une reservation cette annee");
        }
        Reservation existante = reservationRepository.findForReservation(idBloc);
        if (existante != null) {
            Reservation reservation = existante;
            reservation.getEtudiants().add(etudiant);
            Chambre chambre = chambreRepository.findByReservationsIdReservation(reservation.getIdReservation());
            switch (chambre.getTypeChambre()) {
                case TRIPLE:
                    if (reservation.getEtudiants().size() == 3){
                        reservation.setEstValide(false);
                    }
                    break;
                case DOUBLE:
                    reservation.setEstValide(false);
                    break;
            }
            return reservationRepository.save(reservation);
        } else {
            Set<Etudiant> etudiants = new HashSet<>();
            etudiants.add(etudiant);
            Reservation reservation = Reservation.builder().anneeUniversitaire(new Date()).etudiants(etudiants).build();
            Chambre chambre = chambreRepository.getForReservation(idBloc);
            if (chambre == null) {
                throw new IllegalStateException("Aucune chambre disponible dans le bloc " + idBloc);
            }
            Bloc bloc =blocRepository.findById(idBloc)
                    .orElseThrow(() -> new NoSuchElementException("Bloc introuvable : " + idBloc));
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(new Date());
            String idReservation = chambre.getIdChambre()+bloc.getNomBloc()+calendar.get(Calendar.YEAR);
            reservation.setIdReservation(idReservation);
            if (chambre.getTypeChambre().equals(TypeChambre.SIMPLE)){
                reservation.setEstValide(false);
            }else {
                reservation.setEstValide(true);
            }

            // Chambre owns the Chambre-Reservation relation: the reservation must be added
            // to the room, otherwise findForReservation never finds it for the next student.
            Reservation saved = reservationRepository.save(reservation);
            if (chambre.getReservations() == null) {
                chambre.setReservations(new HashSet<>());
            }
            chambre.getReservations().add(saved);
            chambreRepository.save(chambre);
            return saved;
        }


    }

    @Override
    public Reservation annulerReservation(long cinEtudiant) {
        Etudiant etudiant = getEtudiantByCin(cinEtudiant);
        Reservation reservation = reservationRepository.findByEtudiantsCinEtudiantAndAnneeUniversitaire(cinEtudiant, Year.now().getValue());
        if (reservation == null) {
            throw new NoSuchElementException("Aucune reservation cette annee pour l'etudiant CIN " + cinEtudiant);
        }
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
