package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.entities.Reservation;
import tn.esprit.tpfoyer17.services.IReservationService;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for ReservationController: only Spring MVC and the controller are started
 * (no database), the service is mocked with Mockito.
 */
@WebMvcTest(ReservationController.class)
class ReservationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IReservationService reservationService;

    @Test
    void gettingReservation_studentLinkedBackToReservation_returnsJsonWithoutLoop() throws Exception {
        Etudiant etudiant = Etudiant.builder().cinEtudiant(111).build();
        Reservation reservation = Reservation.builder().idReservation("R1").etudiants(Set.of(etudiant)).build();
        etudiant.setReservations(Set.of(reservation));
        when(reservationService.getReservationById("R1")).thenReturn(reservation);

        mockMvc.perform(get("/api/reservations/get").param("idReservation", "R1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.etudiants[0].cinEtudiant").value(111))
                .andExpect(jsonPath("$.etudiants[0].reservations").doesNotExist());
    }

    @Test
    void ajouterReservation_passesBlocAndCinToService() throws Exception {
        when(reservationService.ajouterReservation(3, 111)).thenReturn(Reservation.builder().idReservation("R1").build());

        mockMvc.perform(put("/api/reservations/ajouter-reservation").param("idBloc", "3").param("cinEtudiant", "111"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idReservation").value("R1"));
    }

    @Test
    void getReservationParAnneeUniversitaire_acceptsIsoDate() throws Exception {
        when(reservationService.getReservationParAnneeUniversitaireEtNomUniversite(any(Date.class), eq("ESPRIT")))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/reservations/get-reservation-annee-universitaire-nom-universitaire")
                        .param("anneeUniversite", "2026-01-15").param("nomUniversite", "ESPRIT"))
                .andExpect(status().isOk());

        ArgumentCaptor<Date> date = ArgumentCaptor.forClass(Date.class);
        verify(reservationService).getReservationParAnneeUniversitaireEtNomUniversite(date.capture(), eq("ESPRIT"));
        assertEquals(2026, date.getValue().toInstant().atZone(ZoneId.systemDefault()).getYear());
    }
}
