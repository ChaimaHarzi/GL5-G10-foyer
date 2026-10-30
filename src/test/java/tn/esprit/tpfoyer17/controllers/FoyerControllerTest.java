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
import tn.esprit.tpfoyer17.services.IFoyerService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for FoyerController: only Spring MVC and the controller are started
 * (no database), the service is mocked with Mockito.
 * They check that a request can only set the fields of FoyerRequest, whatever else the JSON body contains.
 */
@WebMvcTest(FoyerController.class)
class FoyerControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IFoyerService foyerService;

    @Test
    void addingFoyer_ignoresIdSentByClient() throws Exception {
        when(foyerService.addFoyer(any(Foyer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/foyers/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idFoyer": 4, "nomFoyer": "F1", "capaciteFoyer": 500}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomFoyer").value("F1"));

        ArgumentCaptor<Foyer> saved = ArgumentCaptor.forClass(Foyer.class);
        verify(foyerService).addFoyer(saved.capture());
        assertEquals(0, saved.getValue().getIdFoyer());
        assertEquals(500, saved.getValue().getCapaciteFoyer());
    }

    @Test
    void updatingFoyer_changesOnlyAllowedFieldsOfExistingFoyer() throws Exception {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").build();
        Foyer existing = Foyer.builder().idFoyer(4).nomFoyer("F1").capaciteFoyer(500).universite(universite).build();
        when(foyerService.getFoyerById(4)).thenReturn(existing);
        when(foyerService.updateFoyer(existing)).thenReturn(existing);

        mockMvc.perform(put("/api/foyers/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idFoyer": 4, "nomFoyer": "F2", "capaciteFoyer": 600}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.capaciteFoyer").value(600));

        assertEquals("F2", existing.getNomFoyer());
        assertSame(universite, existing.getUniversite());
    }

    @Test
    void ajouterFoyerEtAffecterAUniversite_passesNewFoyerAndUniversiteIdToService() throws Exception {
        ArgumentCaptor<Foyer> foyer = ArgumentCaptor.forClass(Foyer.class);
        when(foyerService.ajouterFoyerEtAffecterAUniversite(any(Foyer.class), anyLong()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/foyers/ajouter-affecter")
                        .param("idUniversite", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nomFoyer": "F3", "capaciteFoyer": 300}
                                """))
                .andExpect(status().isOk());

        verify(foyerService).ajouterFoyerEtAffecterAUniversite(foyer.capture(), eq(2L));
        assertEquals("F3", foyer.getValue().getNomFoyer());
    }
}
