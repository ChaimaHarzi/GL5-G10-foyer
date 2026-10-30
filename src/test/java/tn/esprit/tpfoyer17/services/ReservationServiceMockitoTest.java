package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReservationService: repositories are mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceMockitoTest {

    @Mock
    ReservationRepository reservationRepository;

    @Mock
    EtudiantRepository etudiantRepository;

    @Mock
    ChambreRepository chambreRepository;

    @Mock
    BlocRepository blocRepository;

    @InjectMocks
    ReservationService reservationService;

    /** A valid reservation for the current year containing the given students. */
    private Reservation reservationAvec(Etudiant... etudiants) {
        return Reservation.builder()
                .idReservation("1A" + Year.now().getValue())
                .anneeUniversitaire(new Date())
                .estValide(true)
                .etudiants(new HashSet<>(Set.of(etudiants)))
                .build();
    }

    // ---------- CRUD ----------

    @Test
    void getAllReservations_returnsAllReservations() {
        List<Reservation> reservations = List.of(reservationAvec(), reservationAvec());
        when(reservationRepository.findAll()).thenReturn(reservations);

        assertEquals(2, reservationService.getAllReservations().size());
        verify(reservationRepository).findAll();
    }

    @Test
    void getReservationById_existingId_returnsReservation() {
        Reservation reservation = reservationAvec();
        when(reservationRepository.findById("R1")).thenReturn(Optional.of(reservation));

        assertSame(reservation, reservationService.getReservationById("R1"));
    }

    @Test
    void getReservationById_unknownId_throwsException() {
        when(reservationRepository.findById("INCONNU")).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> reservationService.getReservationById("INCONNU"));
    }

    @Test
    void deleteReservation_callsDeleteById() {
        reservationService.deleteReservation("R1");

        verify(reservationRepository).deleteById("R1");
    }

    @Test
    void updateReservation_savesAndReturnsReservation() {
        Reservation reservation = reservationAvec();
        reservation.setEstValide(false);
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation result = reservationService.updateReservation(reservation);

        assertFalse(result.isEstValide());
        verify(reservationRepository).save(reservation);
    }

    // ---------- ajouterReservation: existing reservation ----------

    @Test
    void ajouterReservation_existingReservationInDoubleRoom_addsEtudiantAndClosesReservation() {
        Etudiant e1 = Etudiant.builder().cinEtudiant(111).build();
        Etudiant e2 = Etudiant.builder().cinEtudiant(222).build();
        Reservation reservation = reservationAvec(e1);
        when(reservationRepository.findForReservation(1L)).thenReturn(reservation);
        when(etudiantRepository.findByCinEtudiant(222L)).thenReturn(e2);
        when(chambreRepository.findByReservationsIdReservation(reservation.getIdReservation()))
                .thenReturn(Chambre.builder().typeChambre(TypeChambre.DOUBLE).build());
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation result = reservationService.ajouterReservation(1L, 222L);

        assertEquals(2, result.getEtudiants().size());
        assertFalse(result.isEstValide());
    }

    @Test
    void ajouterReservation_existingReservationInTripleRoom_thirdEtudiant_closesReservation() {
        Etudiant e1 = Etudiant.builder().cinEtudiant(111).build();
        Etudiant e2 = Etudiant.builder().cinEtudiant(222).build();
        Etudiant e3 = Etudiant.builder().cinEtudiant(333).build();
        Reservation reservation = reservationAvec(e1, e2);
        when(reservationRepository.findForReservation(1L)).thenReturn(reservation);
        when(etudiantRepository.findByCinEtudiant(333L)).thenReturn(e3);
        when(chambreRepository.findByReservationsIdReservation(reservation.getIdReservation()))
                .thenReturn(Chambre.builder().typeChambre(TypeChambre.TRIPLE).build());
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation result = reservationService.ajouterReservation(1L, 333L);

        assertEquals(3, result.getEtudiants().size());
        assertFalse(result.isEstValide());
    }

    @Test
    void ajouterReservation_existingReservationInTripleRoom_secondEtudiant_staysValid() {
        Etudiant e1 = Etudiant.builder().cinEtudiant(111).build();
        Etudiant e2 = Etudiant.builder().cinEtudiant(222).build();
        Reservation reservation = reservationAvec(e1);
        when(reservationRepository.findForReservation(1L)).thenReturn(reservation);
        when(etudiantRepository.findByCinEtudiant(222L)).thenReturn(e2);
        when(chambreRepository.findByReservationsIdReservation(reservation.getIdReservation()))
                .thenReturn(Chambre.builder().typeChambre(TypeChambre.TRIPLE).build());
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation result = reservationService.ajouterReservation(1L, 222L);

        assertEquals(2, result.getEtudiants().size());
        assertTrue(result.isEstValide());
    }

    // ---------- ajouterReservation: new reservation ----------

    @Test
    void ajouterReservation_newReservationInSimpleRoom_buildsIdAndIsNotValid() {
        Etudiant etudiant = Etudiant.builder().cinEtudiant(111).build();
        when(reservationRepository.findForReservation(1L)).thenReturn(null);
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(etudiant);
        when(chambreRepository.getForReservation(1L))
                .thenReturn(Chambre.builder().idChambre(5L).typeChambre(TypeChambre.SIMPLE).build());
        when(blocRepository.findById(1L)).thenReturn(Optional.of(Bloc.builder().idBloc(1L).nomBloc("A").build()));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        Reservation result = reservationService.ajouterReservation(1L, 111L);

        assertEquals("5A" + Year.now().getValue(), result.getIdReservation());
        assertTrue(result.getEtudiants().contains(etudiant));
        assertFalse(result.isEstValide());
    }

    @Test
    void ajouterReservation_newReservationInDoubleRoom_isValid() {
        Etudiant etudiant = Etudiant.builder().cinEtudiant(111).build();
        when(reservationRepository.findForReservation(1L)).thenReturn(null);
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(etudiant);
        when(chambreRepository.getForReservation(1L))
                .thenReturn(Chambre.builder().idChambre(5L).typeChambre(TypeChambre.DOUBLE).build());
        when(blocRepository.findById(1L)).thenReturn(Optional.of(Bloc.builder().idBloc(1L).nomBloc("A").build()));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        Reservation result = reservationService.ajouterReservation(1L, 111L);

        assertTrue(result.isEstValide());
    }

    @Test
    void ajouterReservation_newReservation_isLinkedToChambre() {
        Etudiant etudiant = Etudiant.builder().cinEtudiant(111).build();
        Chambre chambre = Chambre.builder().idChambre(5L).typeChambre(TypeChambre.DOUBLE).build();
        when(reservationRepository.findForReservation(1L)).thenReturn(null);
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(etudiant);
        when(chambreRepository.getForReservation(1L)).thenReturn(chambre);
        when(blocRepository.findById(1L)).thenReturn(Optional.of(Bloc.builder().idBloc(1L).nomBloc("A").build()));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        Reservation result = reservationService.ajouterReservation(1L, 111L);

        assertTrue(chambre.getReservations().contains(result));
        verify(chambreRepository).save(chambre);
    }

    @Test
    void ajouterReservation_noFreeRoomInBloc_throwsClearException() {
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(Etudiant.builder().cinEtudiant(111).build());
        when(reservationRepository.findForReservation(1L)).thenReturn(null);
        when(chambreRepository.getForReservation(1L)).thenReturn(null);

        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> reservationService.ajouterReservation(1L, 111L));
        assertTrue(e.getMessage().contains("Aucune chambre disponible"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void ajouterReservation_unknownCin_throwsNotFound() {
        when(etudiantRepository.findByCinEtudiant(999L)).thenReturn(null);

        NoSuchElementException e = assertThrows(NoSuchElementException.class,
                () -> reservationService.ajouterReservation(1L, 999L));
        assertTrue(e.getMessage().contains("999"));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void annulerReservation_noReservationThisYear_throwsNotFound() {
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(Etudiant.builder().cinEtudiant(111).build());
        when(reservationRepository.findByEtudiantsCinEtudiantAndAnneeUniversitaire(111L, Year.now().getValue()))
                .thenReturn(null);

        assertThrows(NoSuchElementException.class, () -> reservationService.annulerReservation(111L));
        verify(reservationRepository, never()).save(any());
    }

    // ---------- annulerReservation ----------

    @Test
    void annulerReservation_removesEtudiantAndReopensReservation() {
        Etudiant etudiant = Etudiant.builder().cinEtudiant(111).build();
        Reservation reservation = reservationAvec(etudiant);
        reservation.setEstValide(false);
        when(reservationRepository.findByEtudiantsCinEtudiantAndAnneeUniversitaire(111L, Year.now().getValue()))
                .thenReturn(reservation);
        when(etudiantRepository.findByCinEtudiant(111L)).thenReturn(etudiant);
        when(reservationRepository.save(reservation)).thenReturn(reservation);

        Reservation result = reservationService.annulerReservation(111L);

        assertTrue(result.getEtudiants().isEmpty());
        assertTrue(result.isEstValide());
    }

    // ---------- getReservationParAnneeUniversitaireEtNomUniversite ----------

    @Test
    void getReservationParAnneeUniversitaireEtNomUniversite_passesYearOfDateToRepository() {
        Date date = new GregorianCalendar(2024, Calendar.SEPTEMBER, 15).getTime();
        List<Reservation> reservations = List.of(reservationAvec());
        when(reservationRepository.findByAnneeUniversitaire_YearAndNomUnuiversite(2024, "ESPRIT"))
                .thenReturn(reservations);

        List<Reservation> result =
                reservationService.getReservationParAnneeUniversitaireEtNomUniversite(date, "ESPRIT");

        assertEquals(reservations, result);
    }
}