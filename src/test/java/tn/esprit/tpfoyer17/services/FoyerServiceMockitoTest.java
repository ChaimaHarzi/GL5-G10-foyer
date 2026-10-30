package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.repositories.FoyerRepository;
import tn.esprit.tpfoyer17.repositories.UniversiteRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FoyerService: repositories are mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class FoyerServiceMockitoTest {

    @Mock
    FoyerRepository foyerRepository;

    @Mock
    UniversiteRepository universiteRepository;

    @InjectMocks
    FoyerService foyerService;

    @Test
    void addFoyer_savesAndReturnsFoyer() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").capaciteFoyer(500).build();
        when(foyerRepository.save(foyer)).thenReturn(foyer);

        Foyer result = foyerService.addFoyer(foyer);

        assertSame(foyer, result);
        verify(foyerRepository).save(foyer);
    }

    @Test
    void getAllFoyers_returnsAllFoyers() {
        List<Foyer> foyers = List.of(
                Foyer.builder().nomFoyer("Foyer A").build(),
                Foyer.builder().nomFoyer("Foyer B").build());
        when(foyerRepository.findAll()).thenReturn(foyers);

        List<Foyer> result = foyerService.getAllFoyers();

        assertEquals(2, result.size());
        verify(foyerRepository).findAll();
    }

    @Test
    void getFoyerById_existingId_returnsFoyer() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").build();
        when(foyerRepository.findById(1L)).thenReturn(Optional.of(foyer));

        Foyer result = foyerService.getFoyerById(1L);

        assertEquals("Foyer A", result.getNomFoyer());
    }

    @Test
    void getFoyerById_unknownId_throwsException() {
        when(foyerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> foyerService.getFoyerById(99L));
    }

    @Test
    void deleteFoyer_callsDeleteById() {
        foyerService.deleteFoyer(1L);

        verify(foyerRepository).deleteById(1L);
    }

    @Test
    void updateFoyer_savesAndReturnsFoyer() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").capaciteFoyer(800).build();
        when(foyerRepository.save(foyer)).thenReturn(foyer);

        Foyer result = foyerService.updateFoyer(foyer);

        assertEquals(800, result.getCapaciteFoyer());
        verify(foyerRepository).save(foyer);
    }

    @Test
    void ajouterFoyerEtAffecterAUniversite_savesFoyerAndLinksItToUniversite() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").build();
        Universite universite = Universite.builder().nomUniversite("ESPRIT").build();
        when(foyerRepository.save(foyer)).thenReturn(foyer);
        when(universiteRepository.findById(1L)).thenReturn(Optional.of(universite));

        Foyer result = foyerService.ajouterFoyerEtAffecterAUniversite(foyer, 1L);

        assertSame(foyer, result);
        assertSame(foyer, universite.getFoyer());
        verify(universiteRepository).save(universite);
    }

    @Test
    void ajouterFoyerEtAffecterAUniversite_unknownUniversite_throwsException() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").build();
        when(universiteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> foyerService.ajouterFoyerEtAffecterAUniversite(foyer, 99L));
        verify(universiteRepository, never()).save(any());
        // the foyer is not saved either: no orphan foyer left in the database
        verify(foyerRepository, never()).save(any());
    }
}
