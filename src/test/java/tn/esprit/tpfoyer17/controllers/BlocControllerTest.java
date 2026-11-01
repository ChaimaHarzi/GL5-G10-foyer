package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.services.IBlocService;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for BlocController: only Spring MVC and the controller are started
 * (no database), the service is mocked with Mockito.
 * They check that a request can only set the fields of BlocRequest, whatever else the JSON body contains.
 */
@WebMvcTest(BlocController.class)
class BlocControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IBlocService blocService;

    @Test
    void addingBloc_ignoresIdAndRelationsSentByClient() throws Exception {
        when(blocService.addBloc(any(Bloc.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/blocs/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idBloc": 7, "nomBloc": "A", "capaciteBloc": 100, "foyer": {"idFoyer": 1}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomBloc").value("A"));

        ArgumentCaptor<Bloc> saved = ArgumentCaptor.forClass(Bloc.class);
        verify(blocService).addBloc(saved.capture());
        assertEquals(0, saved.getValue().getIdBloc());
        assertEquals(100, saved.getValue().getCapaciteBloc());
        assertNull(saved.getValue().getFoyer());
    }

    @Test
    void updatingBloc_changesOnlyAllowedFieldsOfExistingBloc() throws Exception {
        Foyer foyer = Foyer.builder().nomFoyer("F1").build();
        Bloc existing = Bloc.builder().idBloc(7).nomBloc("A").capaciteBloc(100).foyer(foyer).build();
        when(blocService.getBlocById(7)).thenReturn(existing);
        when(blocService.updateBloc(existing)).thenReturn(existing);

        mockMvc.perform(put("/api/blocs/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"idBloc": 7, "nomBloc": "B", "capaciteBloc": 200, "foyer": null}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomBloc").value("B"));

        assertEquals(200, existing.getCapaciteBloc());
        assertSame(foyer, existing.getFoyer());
    }

    @Test
    void gettingBloc_unknownId_returns404() throws Exception {
        when(blocService.getBlocById(99)).thenThrow(new NoSuchElementException("No value present"));

        mockMvc.perform(get("/api/blocs/get").param("idBloc", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
