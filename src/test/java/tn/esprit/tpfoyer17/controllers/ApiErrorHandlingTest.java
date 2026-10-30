package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.services.IBlocService;
import tn.esprit.tpfoyer17.services.IReservationService;

import java.util.NoSuchElementException;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks the HTTP status returned by the REST API when a service throws:
 * only the web layer is started, the services are Mockito mocks.
 */
@WebMvcTest(controllers = {BlocController.class, ReservationController.class})
class ApiErrorHandlingTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IBlocService blocService;

    @MockBean
    IReservationService reservationService;

    @Test
    void unknownId_returns404WithMessage() throws Exception {
        when(blocService.getBlocById(999L)).thenThrow(new NoSuchElementException("Bloc introuvable : 999"));

        mockMvc.perform(get("/api/blocs/get").param("idBloc", "999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail", containsString("Bloc introuvable : 999")));
    }

    @Test
    void fullBloc_returns409WithMessage() throws Exception {
        when(reservationService.ajouterReservation(1L, 111L))
                .thenThrow(new IllegalStateException("Aucune chambre disponible dans le bloc 1"));

        mockMvc.perform(put("/api/reservations/ajouter-reservation")
                        .param("idChambre", "1").param("cinEtudiant", "111"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", containsString("Aucune chambre disponible")));
    }
}
