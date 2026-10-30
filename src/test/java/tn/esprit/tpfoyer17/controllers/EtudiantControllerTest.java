package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.entities.Reservation;
import tn.esprit.tpfoyer17.services.IEtudiantService;

import java.util.HashSet;
import java.util.NoSuchElementException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for EtudiantController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(EtudiantController.class)
class EtudiantControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IEtudiantService etudiantService;

    @Test
    void addEtudiant_ignoresIdSentByTheClientAndUsesTheService() throws Exception {
        when(etudiantService.addEtudiant(any())).thenAnswer(inv -> inv.getArgument(0));
        // Mass assignment attempt: overwrite the existing student 1 through the "add" route
        String json = """
                {"idEtudiant":1,"nomEtudiant":"Ali","prenomEtudiant":"Ben","cinEtudiant":111,"dateNaissance":"2002-05-10"}
                """;

        mockMvc.perform(post("/api/etudiants/add").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<Etudiant> saved = ArgumentCaptor.forClass(Etudiant.class);
        verify(etudiantService).addEtudiant(saved.capture());
        assertEquals(0, saved.getValue().getIdEtudiant());
        assertEquals("Ali", saved.getValue().getNomEtudiant());
        assertEquals("Ben", saved.getValue().getPrenomEtudiant());
        assertEquals(111, saved.getValue().getCinEtudiant());
        assertNotNull(saved.getValue().getDateNaissance());
    }

    @Test
    void updatingEtudiant_keepsTheReservationsOfTheExistingStudent() throws Exception {
        Etudiant existing = Etudiant.builder().idEtudiant(1L).nomEtudiant("Ali").cinEtudiant(111)
                .reservations(new HashSet<>(Set.of(Reservation.builder().idReservation("1A2026").build()))).build();
        when(etudiantService.getEtudiantById(1L)).thenReturn(existing);
        when(etudiantService.updateEtudiant(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/etudiants/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idEtudiant\":1,\"nomEtudiant\":\"Ali\",\"prenomEtudiant\":\"Ben Salah\",\"cinEtudiant\":111}"))
                .andExpect(status().isOk());

        verify(etudiantService).updateEtudiant(existing);
        assertEquals("Ben Salah", existing.getPrenomEtudiant());
        assertEquals(1, existing.getReservations().size());
    }

    @Test
    void updatingEtudiant_unknownId_returns404AndCreatesNothing() throws Exception {
        when(etudiantService.getEtudiantById(999L)).thenThrow(new NoSuchElementException("Etudiant introuvable : 999"));

        mockMvc.perform(put("/api/etudiants/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idEtudiant\":999,\"nomEtudiant\":\"X\",\"cinEtudiant\":1}"))
                .andExpect(status().isNotFound());

        verify(etudiantService, never()).updateEtudiant(any());
    }

    @Test
    void updatingEtudiant_withoutId_returns400() throws Exception {
        mockMvc.perform(put("/api/etudiants/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomEtudiant\":\"X\",\"cinEtudiant\":1}"))
                .andExpect(status().isBadRequest());

        verify(etudiantService, never()).updateEtudiant(any());
    }
}
