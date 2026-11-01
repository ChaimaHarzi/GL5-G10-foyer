package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.Reservation;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.services.IChambreService;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for ChambreController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(ChambreController.class)
class ChambreControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IChambreService chambreService;

    @Test
    void addingChambre_ignoresIdSentByTheClient() throws Exception {
        when(chambreService.addChambre(any())).thenAnswer(inv -> inv.getArgument(0));
        // Mass assignment attempt: overwrite the existing room 1 through the "add" route
        String json = """
                {"idChambre":1,"numeroChambre":999,"typeChambre":"SIMPLE"}
                """;

        mockMvc.perform(post("/api/chambres/add").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<Chambre> saved = ArgumentCaptor.forClass(Chambre.class);
        verify(chambreService).addChambre(saved.capture());
        assertEquals(0, saved.getValue().getIdChambre());
        assertEquals(999, saved.getValue().getNumeroChambre());
        assertEquals(TypeChambre.SIMPLE, saved.getValue().getTypeChambre());
    }

    @Test
    void updatingChambre_keepsBlocAndReservationsOfTheExistingRoom() throws Exception {
        Bloc bloc = Bloc.builder().idBloc(1L).nomBloc("A").build();
        Reservation reservation = Reservation.builder().idReservation("1A2026").build();
        Chambre existing = Chambre.builder().idChambre(1L).numeroChambre(101).typeChambre(TypeChambre.DOUBLE)
                .bloc(bloc).reservations(new HashSet<>(Set.of(reservation))).build();
        when(chambreService.getChambreById(1L)).thenReturn(existing);
        when(chambreService.updateChambre(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/chambres/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idChambre\":1,\"numeroChambre\":201,\"typeChambre\":\"TRIPLE\"}"))
                .andExpect(status().isOk());

        verify(chambreService).updateChambre(existing);
        assertEquals(201, existing.getNumeroChambre());
        assertEquals(TypeChambre.TRIPLE, existing.getTypeChambre());
        assertSame(bloc, existing.getBloc());
        assertEquals(1, existing.getReservations().size());
    }

    @Test
    void updatingChambre_unknownId_returns404AndCreatesNothing() throws Exception {
        when(chambreService.getChambreById(999L)).thenThrow(new NoSuchElementException("Chambre introuvable : 999"));

        mockMvc.perform(put("/api/chambres/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idChambre\":999,\"numeroChambre\":1,\"typeChambre\":\"SIMPLE\"}"))
                .andExpect(status().isNotFound());

        verify(chambreService, never()).updateChambre(any());
    }

    @Test
    void getChambresParBlocEtTypeKeyWord_delegatesToTheService() throws Exception {
        // Before the fix the controller called itself and the request ended in a StackOverflowError
        Chambre simple = Chambre.builder().idChambre(1L).numeroChambre(101).typeChambre(TypeChambre.SIMPLE).build();
        when(chambreService.getChambresParBlocEtTypeKeyWord(3L, TypeChambre.SIMPLE)).thenReturn(List.of(simple));

        mockMvc.perform(get("/api/chambres/get-par-bloc-type-keyword").param("idBloc", "3").param("typeC", "SIMPLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numeroChambre").value(101));

        verify(chambreService).getChambresParBlocEtTypeKeyWord(3L, TypeChambre.SIMPLE);
    }

    @Test
    void updatingChambre_withoutId_returns400() throws Exception {
        mockMvc.perform(put("/api/chambres/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numeroChambre\":1,\"typeChambre\":\"SIMPLE\"}"))
                .andExpect(status().isBadRequest());

        verify(chambreService, never()).updateChambre(any());
    }
}
