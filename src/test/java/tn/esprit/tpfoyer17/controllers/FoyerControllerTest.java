package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.services.IFoyerService;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for FoyerController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(FoyerController.class)
class FoyerControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IFoyerService foyerService;

    // Mass assignment attempt: overwrite the existing foyer 1 through a "create" route
    private static final String JSON_AVEC_ID = """
            {"idFoyer":1,"nomFoyer":"Foyer C","capaciteFoyer":80}
            """;

    @Test
    void addingFoyer_ignoresIdSentByTheClient() throws Exception {
        when(foyerService.addFoyer(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/foyers/add").contentType(MediaType.APPLICATION_JSON).content(JSON_AVEC_ID))
                .andExpect(status().isOk());

        ArgumentCaptor<Foyer> saved = ArgumentCaptor.forClass(Foyer.class);
        verify(foyerService).addFoyer(saved.capture());
        assertEquals(0, saved.getValue().getIdFoyer());
        assertEquals("Foyer C", saved.getValue().getNomFoyer());
        assertEquals(80, saved.getValue().getCapaciteFoyer());
    }

    @Test
    void ajouterFoyerEtAffecter_ignoresIdSentByTheClient() throws Exception {
        when(foyerService.ajouterFoyerEtAffecterAUniversite(any(), eq(2L))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/foyers/ajouter-affecter").param("idUniversite", "2")
                        .contentType(MediaType.APPLICATION_JSON).content(JSON_AVEC_ID))
                .andExpect(status().isOk());

        ArgumentCaptor<Foyer> saved = ArgumentCaptor.forClass(Foyer.class);
        verify(foyerService).ajouterFoyerEtAffecterAUniversite(saved.capture(), eq(2L));
        assertEquals(0, saved.getValue().getIdFoyer());
        assertEquals("Foyer C", saved.getValue().getNomFoyer());
    }

    @Test
    void updatingFoyer_changesOnlyAllowedFieldsOfTheExistingFoyer() throws Exception {
        Foyer existing = Foyer.builder().idFoyer(1L).nomFoyer("Foyer A").capaciteFoyer(100).build();
        when(foyerService.getFoyerById(1L)).thenReturn(existing);
        when(foyerService.updateFoyer(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/foyers/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idFoyer\":1,\"nomFoyer\":\"Foyer A2\",\"capaciteFoyer\":120}"))
                .andExpect(status().isOk());

        verify(foyerService).updateFoyer(existing);
        assertEquals("Foyer A2", existing.getNomFoyer());
        assertEquals(120, existing.getCapaciteFoyer());
    }

    @Test
    void updatingFoyer_unknownId_returns404AndCreatesNothing() throws Exception {
        when(foyerService.getFoyerById(999L)).thenThrow(new NoSuchElementException("Foyer introuvable : 999"));

        mockMvc.perform(put("/api/foyers/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idFoyer\":999,\"nomFoyer\":\"X\",\"capaciteFoyer\":1}"))
                .andExpect(status().isNotFound());

        verify(foyerService, never()).updateFoyer(any());
    }

    @Test
    void updatingFoyer_withoutId_returns400() throws Exception {
        mockMvc.perform(put("/api/foyers/update").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nomFoyer\":\"X\",\"capaciteFoyer\":1}"))
                .andExpect(status().isBadRequest());

        verify(foyerService, never()).updateFoyer(any());
    }
}
