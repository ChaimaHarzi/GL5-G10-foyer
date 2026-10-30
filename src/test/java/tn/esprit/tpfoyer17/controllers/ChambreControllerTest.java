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
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.services.IChambreService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for ChambreController: only Spring MVC and the controller are started
 * (no database), the service is mocked with Mockito.
 * They check that a request can only set the fields of ChambreRequest, whatever else the JSON body contains.
 */
@WebMvcTest(ChambreController.class)
class ChambreControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IChambreService chambreService;

    @Test
    void addingChambre_ignoresIdAndRelationsSentByClient() throws Exception {
        when(chambreService.addChambre(any(Chambre.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/chambres/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idChambre": 9, "numeroChambre": 101, "typeChambre": "DOUBLE", "bloc": {"idBloc": 3}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.typeChambre").value("DOUBLE"));

        ArgumentCaptor<Chambre> saved = ArgumentCaptor.forClass(Chambre.class);
        verify(chambreService).addChambre(saved.capture());
        assertEquals(0, saved.getValue().getIdChambre());
        assertEquals(101, saved.getValue().getNumeroChambre());
        assertNull(saved.getValue().getBloc());
    }

    @Test
    void updatingChambre_changesOnlyAllowedFieldsOfExistingChambre() throws Exception {
        Bloc bloc = Bloc.builder().nomBloc("A").build();
        Chambre existing = Chambre.builder().idChambre(9).numeroChambre(101).typeChambre(TypeChambre.SIMPLE).bloc(bloc).build();
        when(chambreService.getChambreById(9)).thenReturn(existing);
        when(chambreService.updateChambre(existing)).thenReturn(existing);

        mockMvc.perform(put("/api/chambres/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idChambre": 9, "numeroChambre": 102, "typeChambre": "TRIPLE", "bloc": null}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numeroChambre").value(102));

        assertEquals(TypeChambre.TRIPLE, existing.getTypeChambre());
        assertSame(bloc, existing.getBloc());
    }
}
