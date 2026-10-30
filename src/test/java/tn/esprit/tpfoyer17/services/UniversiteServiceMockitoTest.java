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
 * Unit tests for UniversiteService: repositories are mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class UniversiteServiceMockitoTest {

    @Mock
    UniversiteRepository universiteRepository;

    @Mock
    FoyerRepository foyerRepository;

    @InjectMocks
    UniversiteService universiteService;

    @Test
    void addUniversite_savesAndReturnsUniversite() {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").adresse("Ariana").build();
        when(universiteRepository.save(universite)).thenReturn(universite);

        Universite result = universiteService.addUniversite(universite);

        assertSame(universite, result);
        verify(universiteRepository).save(universite);
    }

    @Test
    void getAllUniversites_returnsAllUniversites() {
        List<Universite> universites = List.of(
                Universite.builder().nomUniversite("ESPRIT").build(),
                Universite.builder().nomUniversite("INSAT").build());
        when(universiteRepository.findAll()).thenReturn(universites);

        List<Universite> result = universiteService.getAllUniversites();

        assertEquals(2, result.size());
        verify(universiteRepository).findAll();
    }

    @Test
    void getUniversiteById_existingId_returnsUniversite() {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").build();
        when(universiteRepository.findById(1L)).thenReturn(Optional.of(universite));

        Universite result = universiteService.getUniversiteById(1L);

        assertEquals("ESPRIT", result.getNomUniversite());
    }

    @Test
    void getUniversiteById_unknownId_throwsException() {
        when(universiteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> universiteService.getUniversiteById(99L));
    }

    @Test
    void deleteUniversite_callsDeleteById() {
        universiteService.deleteUniversite(1L);

        verify(universiteRepository).deleteById(1L);
    }

    @Test
    void updateUniversite_savesAndReturnsUniversite() {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").adresse("Tunis").build();
        when(universiteRepository.save(universite)).thenReturn(universite);

        Universite result = universiteService.updateUniversite(universite);

        assertEquals("Tunis", result.getAdresse());
        verify(universiteRepository).save(universite);
    }

    @Test
    void affecterFoyerAUniversite_linksFoyerToUniversite() {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").build();
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").build();
        when(universiteRepository.findByNomUniversite("ESPRIT")).thenReturn(universite);
        when(foyerRepository.findById(1L)).thenReturn(Optional.of(foyer));
        when(universiteRepository.save(universite)).thenReturn(universite);

        Universite result = universiteService.affecterFoyerAUniversite(1L, "ESPRIT");

        assertSame(foyer, result.getFoyer());
        verify(universiteRepository).save(universite);
    }

    @Test
    void affecterFoyerAUniversite_unknownFoyer_throwsException() {
        Universite universite = Universite.builder().nomUniversite("ESPRIT").build();
        when(universiteRepository.findByNomUniversite("ESPRIT")).thenReturn(universite);
        when(foyerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> universiteService.affecterFoyerAUniversite(99L, "ESPRIT"));
        verify(universiteRepository, never()).save(any());
    }

    @Test
    void affecterFoyerAUniversite_unknownUniversite_throwsNotFound() {
        when(universiteRepository.findByNomUniversite("INCONNUE")).thenReturn(null);

        NoSuchElementException e = assertThrows(NoSuchElementException.class,
                () -> universiteService.affecterFoyerAUniversite(1L, "INCONNUE"));
        assertTrue(e.getMessage().contains("INCONNUE"));
        verify(universiteRepository, never()).save(any());
    }

    @Test
    void desaffecterFoyerAUniversite_removesFoyerFromUniversite() {
        Foyer foyer = Foyer.builder().nomFoyer("Foyer A").build();
        Universite universite = Universite.builder().nomUniversite("ESPRIT").foyer(foyer).build();
        when(universiteRepository.findById(1L)).thenReturn(Optional.of(universite));
        when(universiteRepository.save(universite)).thenReturn(universite);

        Universite result = universiteService.desaffecterFoyerAUniversite(1L);

        assertNull(result.getFoyer());
        verify(universiteRepository).save(universite);
    }
}