package tn.esprit.tpfoyer17.controllers;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.services.IBlocService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web layer tests for BlocController: the service is a Mockito mock, the JSON sent
 * by the client goes through Spring MVC and Jackson like in production.
 */
@WebMvcTest(BlocController.class)
class BlocControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    IBlocService blocService;

    @Test
    void addingBloc_ignoresIdAndRoomsSentByTheClient() throws Exception {
        when(blocService.addBloc(any())).thenAnswer(inv -> inv.getArgument(0));
        // Mass assignment attempt: choose the id (overwrite bloc 1) and attach rooms
        String json = """
                {"idBloc":1,"nomBloc":"A","capaciteBloc":10,"idFoyer":3,"chambres":[{"idChambre":5}]}
                """;

        mockMvc.perform(post("/api/blocs/add").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<Bloc> saved = ArgumentCaptor.forClass(Bloc.class);
        verify(blocService).addBloc(saved.capture());
        assertEquals(0, saved.getValue().getIdBloc());
        assertNull(saved.getValue().getChambres());
        assertEquals("A", saved.getValue().getNomBloc());
        assertEquals(10, saved.getValue().getCapaciteBloc());
        assertEquals(3, saved.getValue().getFoyer().getIdFoyer());
    }
}
