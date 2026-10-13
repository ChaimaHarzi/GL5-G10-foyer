package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ChambreService: the repository is mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class ChambreServiceMockitoTest {

    @Mock
    ChambreRepository chambreRepository;

    @InjectMocks
    ChambreService chambreService;

    @Test
    void addChambre_savesAndReturnsChambre() {
        Chambre chambre = Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).build();
        when(chambreRepository.save(chambre)).thenReturn(chambre);

        Chambre result = chambreService.addChambre(chambre);

        assertSame(chambre, result);
        verify(chambreRepository).save(chambre);
    }

    @Test
    void getAllChambres_returnsAllChambres() {
        List<Chambre> chambres = List.of(
                Chambre.builder().numeroChambre(101).build(),
                Chambre.builder().numeroChambre(102).build());
        when(chambreRepository.findAll()).thenReturn(chambres);

        List<Chambre> result = chambreService.getAllChambres();

        assertEquals(2, result.size());
        verify(chambreRepository).findAll();
    }

    @Test
    void getChambreById_existingId_returnsChambre() {
        Chambre chambre = Chambre.builder().numeroChambre(101).build();
        when(chambreRepository.findById(1L)).thenReturn(Optional.of(chambre));

        Chambre result = chambreService.getChambreById(1L);

        assertEquals(101, result.getNumeroChambre());
    }

    @Test
    void getChambreById_unknownId_throwsException() {
        when(chambreRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> chambreService.getChambreById(99L));
    }

    @Test
    void deleteChambre_callsDeleteById() {
        chambreService.deleteChambre(1L);

        verify(chambreRepository).deleteById(1L);
    }

    @Test
    void updateChambre_savesAndReturnsChambre() {
        Chambre chambre = Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.DOUBLE).build();
        when(chambreRepository.save(chambre)).thenReturn(chambre);

        Chambre result = chambreService.updateChambre(chambre);

        assertEquals(TypeChambre.DOUBLE, result.getTypeChambre());
        verify(chambreRepository).save(chambre);
    }

    @Test
    void getChambresParNomUniversite_delegatesToRepository() {
        List<Chambre> chambres = List.of(Chambre.builder().numeroChambre(101).build());
        when(chambreRepository.findByBlocFoyerUniversiteNomUniversite("ESPRIT")).thenReturn(chambres);

        List<Chambre> result = chambreService.getChambresParNomUniversite("ESPRIT");

        assertEquals(chambres, result);
    }

    @Test
    void getChambresParBlocEtTypeKeyWord_delegatesToRepository() {
        List<Chambre> chambres = List.of(Chambre.builder().typeChambre(TypeChambre.SIMPLE).build());
        when(chambreRepository.findByBlocIdBlocAndTypeChambre(1L, TypeChambre.SIMPLE)).thenReturn(chambres);

        List<Chambre> result = chambreService.getChambresParBlocEtTypeKeyWord(1L, TypeChambre.SIMPLE);

        assertEquals(chambres, result);
    }

    @Test
    void getChambresParBlocEtTypeJPQL_delegatesToRepository() {
        List<Chambre> chambres = List.of(Chambre.builder().typeChambre(TypeChambre.TRIPLE).build());
        when(chambreRepository.findByBlocIdBlocAndTypeChambreJPQL(1L, TypeChambre.TRIPLE)).thenReturn(chambres);

        List<Chambre> result = chambreService.getChambresParBlocEtTypeJPQL(1L, TypeChambre.TRIPLE);

        assertEquals(chambres, result);
    }

    @Test
    void getChambresNonReserveParNomUniversiteEtTypeChambre_delegatesToRepository() {
        List<Chambre> chambres = List.of(Chambre.builder().typeChambre(TypeChambre.DOUBLE).build());
        when(chambreRepository.getChambresNonReserveParNomUniversiteEtTypeChambre("ESPRIT", TypeChambre.DOUBLE))
                .thenReturn(chambres);

        List<Chambre> result =
                chambreService.getChambresNonReserveParNomUniversiteEtTypeChambre("ESPRIT", TypeChambre.DOUBLE);

        assertEquals(chambres, result);
    }

    @Test
    void getChambreNonReserver_queriesRepository() {
        when(chambreRepository.getChambresNonReserve()).thenReturn(List.of());

        chambreService.getChambreNonReserver();

        verify(chambreRepository).getChambresNonReserve();
    }
}
