package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.services.IReservationService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for ReservationController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(ReservationController.class)
class ReservationControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IReservationService reservationService;

    @Test
    void updateRoute_doesNotExist_soBusinessRulesCannotBeBypassed() throws Exception {
        // 4 students in a double room, declared "not full": must not reach the database
        String json = """
                {"idReservation":"1A2026","estValide":true,
                 "etudiants":[{"idEtudiant":1},{"idEtudiant":2},{"idEtudiant":3},{"idEtudiant":4}]}
                """;

        mockMvc.perform(put("/api/reservations/update").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isNotFound());

        verify(reservationService, never()).updateReservation(any());
    }
}
