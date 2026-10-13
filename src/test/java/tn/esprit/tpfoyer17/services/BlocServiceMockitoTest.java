package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.repositories.BlocRepository;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BlocService: repositories are mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class BlocServiceMockitoTest {

    @Mock
    BlocRepository blocRepository;

    @Mock
    ChambreRepository chambreRepository;

    @InjectMocks
    BlocService blocService;

    @Test
    void addBloc_savesAndReturnsBloc() {
        Bloc bloc = Bloc.builder().nomBloc("A").capaciteBloc(100).build();
        when(blocRepository.save(bloc)).thenReturn(bloc);

        Bloc result = blocService.addBloc(bloc);

        assertSame(bloc, result);
        verify(blocRepository).save(bloc);
    }

    @Test
    void getAllBlocs_returnsAllBlocs() {
        List<Bloc> blocs = List.of(
                Bloc.builder().nomBloc("A").build(),
                Bloc.builder().nomBloc("B").build());
        when(blocRepository.findAll()).thenReturn(blocs);

        List<Bloc> result = blocService.getAllBlocs();

        assertEquals(2, result.size());
        verify(blocRepository).findAll();
    }

    @Test
    void getBlocById_existingId_returnsBloc() {
        Bloc bloc = Bloc.builder().nomBloc("A").build();
        when(blocRepository.findById(1L)).thenReturn(Optional.of(bloc));

        Bloc result = blocService.getBlocById(1L);

        assertEquals("A", result.getNomBloc());
    }

    @Test
    void getBlocById_unknownId_throwsException() {
        when(blocRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> blocService.getBlocById(99L));
    }

    @Test
    void deleteBloc_callsDeleteById() {
        blocService.deleteBloc(1L);

        verify(blocRepository).deleteById(1L);
    }

    @Test
    void updateBloc_savesAndReturnsBloc() {
        Bloc bloc = Bloc.builder().nomBloc("A modifié").build();
        when(blocRepository.save(bloc)).thenReturn(bloc);

        Bloc result = blocService.updateBloc(bloc);

        assertEquals("A modifié", result.getNomBloc());
        verify(blocRepository).save(bloc);
    }

    @Test
    void affecterChambresABloc_setsBlocOnEachChambre() {
        Bloc bloc = Bloc.builder().nomBloc("A").build();
        Chambre c1 = Chambre.builder().numeroChambre(101).build();
        Chambre c2 = Chambre.builder().numeroChambre(102).build();
        List<Long> ids = List.of(1L, 2L);
        when(blocRepository.findById(1L)).thenReturn(Optional.of(bloc));
        when(chambreRepository.findAllById(ids)).thenReturn(List.of(c1, c2));

        Bloc result = blocService.affecterChambresABloc(ids, 1L);

        assertSame(bloc, result);
        assertSame(bloc, c1.getBloc());
        assertSame(bloc, c2.getBloc());
    }
}
