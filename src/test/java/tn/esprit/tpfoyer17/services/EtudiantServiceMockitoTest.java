package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.repositories.EtudiantRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EtudiantService: the repository is mocked with Mockito,
 * so only the service logic is tested (no Spring context, no database).
 */
@ExtendWith(MockitoExtension.class)
class EtudiantServiceMockitoTest {

    @Mock
    EtudiantRepository etudiantRepository;

    @InjectMocks
    EtudiantService etudiantService;

    @Test
    void addEtudiant_savesAndReturnsEtudiant() {
        Etudiant etudiant = Etudiant.builder().nomEtudiant("Harzi").prenomEtudiant("Chaima").cinEtudiant(12345678).build();
        when(etudiantRepository.save(etudiant)).thenReturn(etudiant);

        Etudiant result = etudiantService.addEtudiant(etudiant);

        assertSame(etudiant, result);
        verify(etudiantRepository).save(etudiant);
    }

    @Test
    void getAllEtudiants_returnsAllEtudiants() {
        List<Etudiant> etudiants = List.of(
                Etudiant.builder().nomEtudiant("Harzi").build(),
                Etudiant.builder().nomEtudiant("Ben Ali").build());
        when(etudiantRepository.findAll()).thenReturn(etudiants);

        List<Etudiant> result = etudiantService.getAllEtudiants();

        assertEquals(2, result.size());
        verify(etudiantRepository).findAll();
    }

    @Test
    void getEtudiantById_existingId_returnsEtudiant() {
        Etudiant etudiant = Etudiant.builder().nomEtudiant("Harzi").build();
        when(etudiantRepository.findById(1L)).thenReturn(Optional.of(etudiant));

        Etudiant result = etudiantService.getEtudiantById(1L);

        assertEquals("Harzi", result.getNomEtudiant());
    }

    @Test
    void getEtudiantById_unknownId_throwsException() {
        when(etudiantRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> etudiantService.getEtudiantById(99L));
    }

    @Test
    void deleteEtudiant_callsDeleteById() {
        etudiantService.deleteEtudiant(1L);

        verify(etudiantRepository).deleteById(1L);
    }

    @Test
    void updateEtudiant_savesAndReturnsEtudiant() {
        Etudiant etudiant = Etudiant.builder().nomEtudiant("Harzi").prenomEtudiant("Chaima modifié").build();
        when(etudiantRepository.save(etudiant)).thenReturn(etudiant);

        Etudiant result = etudiantService.updateEtudiant(etudiant);

        assertEquals("Chaima modifié", result.getPrenomEtudiant());
        verify(etudiantRepository).save(etudiant);
    }
}