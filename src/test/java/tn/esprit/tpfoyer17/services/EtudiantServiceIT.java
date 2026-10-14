package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.repositories.EtudiantRepository;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for EtudiantService without Mockito: the real service and repository
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class EtudiantServiceIT {

    @Autowired
    IEtudiantService etudiantService;

    @Autowired
    EtudiantRepository etudiantRepository;

    @Test
    void addEtudiant_persistsEtudiantWithGeneratedId() {
        Etudiant saved = etudiantService.addEtudiant(Etudiant.builder()
                .nomEtudiant("Harzi").prenomEtudiant("Chaima").cinEtudiant(12345678).dateNaissance(new Date())
                .build());

        assertTrue(saved.getIdEtudiant() > 0);
        assertEquals("Harzi", etudiantService.getEtudiantById(saved.getIdEtudiant()).getNomEtudiant());
    }

    @Test
    void getAllEtudiants_returnsSavedEtudiants() {
        etudiantService.addEtudiant(Etudiant.builder().nomEtudiant("Harzi").cinEtudiant(11111111).build());
        etudiantService.addEtudiant(Etudiant.builder().nomEtudiant("Ben Ali").cinEtudiant(22222222).build());

        List<Etudiant> etudiants = etudiantService.getAllEtudiants();

        assertEquals(2, etudiants.size());
    }

    @Test
    void updateEtudiant_changesStoredValues() {
        Etudiant saved = etudiantService.addEtudiant(
                Etudiant.builder().nomEtudiant("Harzi").prenomEtudiant("Chaima").build());

        saved.setPrenomEtudiant("Chaima modifié");
        etudiantService.updateEtudiant(saved);

        assertEquals("Chaima modifié", etudiantService.getEtudiantById(saved.getIdEtudiant()).getPrenomEtudiant());
    }

    @Test
    void deleteEtudiant_removesEtudiant() {
        Etudiant saved = etudiantService.addEtudiant(Etudiant.builder().nomEtudiant("Harzi").build());

        etudiantService.deleteEtudiant(saved.getIdEtudiant());

        assertThrows(NoSuchElementException.class, () -> etudiantService.getEtudiantById(saved.getIdEtudiant()));
    }

    @Test
    void findByCinEtudiant_returnsMatchingEtudiant() {
        etudiantService.addEtudiant(Etudiant.builder().nomEtudiant("Harzi").cinEtudiant(12345678).build());
        etudiantService.addEtudiant(Etudiant.builder().nomEtudiant("Ben Ali").cinEtudiant(87654321).build());

        Etudiant found = etudiantRepository.findByCinEtudiant(12345678);

        assertNotNull(found);
        assertEquals("Harzi", found.getNomEtudiant());
    }
}
