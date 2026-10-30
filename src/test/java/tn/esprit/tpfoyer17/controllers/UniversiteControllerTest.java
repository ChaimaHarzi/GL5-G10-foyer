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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for UniversiteController: only Spring MVC and the controller are started
 * (no database), the service is mocked with Mockito.
 * They check that a request can only set the fields of UniversiteRequest, whatever else the JSON body contains.
 */
@WebMvcTest(UniversiteController.class)
class UniversiteControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IUniversiteService universiteService;

    @Test
    void addingUniversite_ignoresIdAndFoyerSentByClient() throws Exception {
        when(universiteService.addUniversite(any(Universite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/universites/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idUniversite": 5, "nomUniversite": "ESPRIT", "adresse": "Ariana", "foyer": {"idFoyer": 1}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomUniversite").value("ESPRIT"));

        ArgumentCaptor<Universite> saved = ArgumentCaptor.forClass(Universite.class);
        verify(universiteService).addUniversite(saved.capture());
        assertEquals(0, saved.getValue().getIdUniversite());
        assertEquals("Ariana", saved.getValue().getAdresse());
        assertNull(saved.getValue().getFoyer());
    }

    @Test
    void updatingUniversite_changesOnlyAllowedFieldsOfExistingUniversite() throws Exception {
        Foyer foyer = Foyer.builder().nomFoyer("F1").build();
        Universite existing = Universite.builder().idUniversite(5).nomUniversite("ESPRIT").adresse("Ariana").foyer(foyer).build();
        when(universiteService.getUniversiteById(5)).thenReturn(existing);
        when(universiteService.updateUniversite(existing)).thenReturn(existing);

        mockMvc.perform(put("/api/universites/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idUniversite": 5, "nomUniversite": "ESPRIT", "adresse": "Tunis", "foyer": null}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adresse").value("Tunis"));

        assertEquals("ESPRIT", existing.getNomUniversite());
        assertSame(foyer, existing.getFoyer());
    }
}
