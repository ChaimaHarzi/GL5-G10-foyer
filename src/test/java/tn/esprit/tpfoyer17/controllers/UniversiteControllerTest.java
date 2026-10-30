package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.services.IUniversiteService;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for UniversiteController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(UniversiteController.class)
class UniversiteControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IUniversiteService universiteService;

    @Test
    void addingUniversite_ignoresIdAndFoyerSentByTheClient() throws Exception {
        when(universiteService.addUniversite(any())).thenAnswer(inv -> inv.getArgument(0));
        // Mass assignment attempt: overwrite universite 1 and attach foyer 1 without affecter-foyer-universite
        String json = """
                {"idUniversite":1,"nomUniversite":"ESPRIT","adresse":"Tunis","foyer":{"idFoyer":1}}
                """;

        mockMvc.perform(post("/api/universites/add").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<Universite> saved = ArgumentCaptor.forClass(Universite.class);
        verify(universiteService).addUniversite(saved.capture());
        assertEquals(0, saved.getValue().getIdUniversite());
        assertNull(saved.getValue().getFoyer());
        assertEquals("ESPRIT", saved.getValue().getNomUniversite());
        assertEquals("Tunis", saved.getValue().getAdresse());
    }

    @Test
    void updatingUniversite_keepsTheFoyerOfTheExistingUniversite() throws Exception {
        Foyer foyer = Foyer.builder().idFoyer(1L).nomFoyer("Foyer A").build();
        Universite existing = Universite.builder().idUniversite(1L).nomUniversite("ESPRIT").adresse("Tunis")
                .foyer(foyer).build();
        when(universiteService.getUniversiteById(1L)).thenReturn(existing);
        when(universiteService.updateUniversite(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/universites/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUniversite\":1,\"nomUniversite\":\"ESPRIT\",\"adresse\":\"Ariana\"}"))
                .andExpect(status().isOk());

        verify(universiteService).updateUniversite(existing);
        assertEquals("Ariana", existing.getAdresse());
        assertSame(foyer, existing.getFoyer());
    }

    @Test
    void updatingUniversite_unknownId_returns404AndCreatesNothing() throws Exception {
        when(universiteService.getUniversiteById(999L))
                .thenThrow(new NoSuchElementException("Universite introuvable : 999"));

        mockMvc.perform(put("/api/universites/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUniversite\":999,\"nomUniversite\":\"X\"}"))
                .andExpect(status().isNotFound());

        verify(universiteService, never()).updateUniversite(any());
    }

    @Test
    void updatingUniversite_withoutId_returns400() throws Exception {
        mockMvc.perform(put("/api/universites/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomUniversite\":\"X\"}"))
                .andExpect(status().isBadRequest());

        verify(universiteService, never()).updateUniversite(any());
    }
}
