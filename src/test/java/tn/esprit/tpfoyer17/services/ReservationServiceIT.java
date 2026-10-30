package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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

import java.util.Date;
import java.util.HashSet;
import java.util.NoSuchElementException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ReservationService without Mockito: the real service and repositories
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class ReservationServiceIT {

    @Autowired
    IReservationService reservationService;

    @Autowired
    ReservationRepository reservationRepository;

    @Autowired
    EtudiantRepository etudiantRepository;

    @Autowired
    ChambreRepository chambreRepository;

    @Autowired
    BlocRepository blocRepository;

    private Etudiant etudiant(long cin) {
        return etudiantRepository.save(Etudiant.builder().nomEtudiant("Etudiant " + cin).cinEtudiant(cin).build());
    }

    /** Saves a valid reservation for the current year. The id is set manually, like in the service. */
    private Reservation reservation(String id, Etudiant... etudiants) {
        return reservationRepository.save(Reservation.builder()
                .idReservation(id)
                .anneeUniversitaire(new Date())
                .estValide(true)
                .etudiants(new HashSet<>(Set.of(etudiants)))
                .build());
    }

    @Test
    void getAllReservations_returnsSavedReservations() {
        reservation("R1");
        reservation("R2");

        assertEquals(2, reservationService.getAllReservations().size());
    }

    @Test
    void getReservationById_returnsReservation() {
        reservation("R1");

        assertEquals("R1", reservationService.getReservationById("R1").getIdReservation());
    }

    @Test
    void updateReservation_changesStoredValues() {
        Reservation saved = reservation("R1");

        saved.setEstValide(false);
        reservationService.updateReservation(saved);

        assertFalse(reservationService.getReservationById("R1").isEstValide());
    }

    @Test
    void deleteReservation_removesReservation() {
        reservation("R1");

        reservationService.deleteReservation("R1");

        assertThrows(NoSuchElementException.class, () -> reservationService.getReservationById("R1"));
    }

    @Test
    void ajouterReservation_existingReservationInDoubleRoom_addsEtudiantAndClosesReservation() {
        Etudiant e1 = etudiant(111);
        etudiant(222);
        Reservation r = reservation("R1", e1);
        Bloc bloc = blocRepository.save(Bloc.builder().nomBloc("A").build());
        chambreRepository.save(Chambre.builder()
                .numeroChambre(101).typeChambre(TypeChambre.DOUBLE).bloc(bloc)
                .reservations(new HashSet<>(Set.of(r)))
                .build());

        reservationService.ajouterReservation(bloc.getIdBloc(), 222);

        Reservation reloaded = reservationService.getReservationById("R1");
        assertEquals(2, reloaded.getEtudiants().size());
        assertFalse(reloaded.isEstValide());
    }

    @Test
    void ajouterReservation_twoEtudiantsInDoubleRoom_shareTheSameReservation() {
        etudiant(111);
        etudiant(222);
        // A room that was never reserved: the first reservation must work on an empty database
        Bloc bloc = blocRepository.save(Bloc.builder().nomBloc("A").build());
        chambreRepository.save(Chambre.builder()
                .numeroChambre(101).typeChambre(TypeChambre.DOUBLE).bloc(bloc)
                .build());

        Reservation first = reservationService.ajouterReservation(bloc.getIdBloc(), 111);
        reservationService.ajouterReservation(bloc.getIdBloc(), 222);

        Reservation reloaded = reservationService.getReservationById(first.getIdReservation());
        assertEquals(2, reloaded.getEtudiants().size());
        assertFalse(reloaded.isEstValide());
    }

    @Test
    void ajouterReservation_sameEtudiantTwiceThisYear_isRefused() {
        etudiant(111);
        Bloc bloc = blocRepository.save(Bloc.builder().nomBloc("A").build());
        chambreRepository.save(Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.DOUBLE).bloc(bloc).build());
        chambreRepository.save(Chambre.builder().numeroChambre(102).typeChambre(TypeChambre.DOUBLE).bloc(bloc).build());

        Reservation first = reservationService.ajouterReservation(bloc.getIdBloc(), 111);

        assertThrows(IllegalStateException.class, () -> reservationService.ajouterReservation(bloc.getIdBloc(), 111));
        assertEquals(1, reservationService.getReservationById(first.getIdReservation()).getEtudiants().size());
    }

    @Test
    void annulerReservation_removesEtudiantAndReopensReservation() {
        Etudiant e = etudiant(111);
        Reservation r = reservation("R1", e);
        r.setEstValide(false);

        reservationService.annulerReservation(111);

        Reservation reloaded = reservationService.getReservationById("R1");
        assertTrue(reloaded.getEtudiants().isEmpty());
        assertTrue(reloaded.isEstValide());
    }
}