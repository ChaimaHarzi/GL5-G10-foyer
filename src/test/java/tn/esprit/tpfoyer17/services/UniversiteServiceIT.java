package tn.esprit.tpfoyer17.services;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.repositories.FoyerRepository;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for UniversiteService without Mockito: the real service and repositories
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class UniversiteServiceIT {

    @Autowired
    IUniversiteService universiteService;

    @Autowired
    FoyerRepository foyerRepository;

    @Test
    void addUniversite_persistsUniversiteWithGeneratedId() {
        Universite saved = universiteService.addUniversite(
                Universite.builder().nomUniversite("ESPRIT").adresse("Ariana").build());

        assertTrue(saved.getIdUniversite() > 0);
        assertEquals("ESPRIT", universiteService.getUniversiteById(saved.getIdUniversite()).getNomUniversite());
    }

    @Test
    void getAllUniversites_returnsSavedUniversites() {
        universiteService.addUniversite(Universite.builder().nomUniversite("ESPRIT").build());
        universiteService.addUniversite(Universite.builder().nomUniversite("INSAT").build());

        List<Universite> universites = universiteService.getAllUniversites();

        assertEquals(2, universites.size());
    }

    @Test
    void updateUniversite_changesStoredValues() {
        Universite saved = universiteService.addUniversite(
                Universite.builder().nomUniversite("ESPRIT").adresse("Ariana").build());

        saved.setAdresse("Tunis");
        universiteService.updateUniversite(saved);

        assertEquals("Tunis", universiteService.getUniversiteById(saved.getIdUniversite()).getAdresse());
    }

    @Test
    void deleteUniversite_removesUniversite() {
        Universite saved = universiteService.addUniversite(Universite.builder().nomUniversite("ESPRIT").build());

        universiteService.deleteUniversite(saved.getIdUniversite());

        long idUniversite = saved.getIdUniversite();
        assertThrows(NoSuchElementException.class, () -> universiteService.getUniversiteById(idUniversite));

    }

    @Test
    void affecterFoyerAUniversite_linksFoyerToUniversiteByName() {
        Foyer foyer = foyerRepository.save(Foyer.builder().nomFoyer("Foyer A").build());
        Universite universite = universiteService.addUniversite(Universite.builder().nomUniversite("ESPRIT").build());

        universiteService.affecterFoyerAUniversite(foyer.getIdFoyer(), "ESPRIT");

        Universite reloaded = universiteService.getUniversiteById(universite.getIdUniversite());
        assertNotNull(reloaded.getFoyer());
        assertEquals(foyer.getIdFoyer(), reloaded.getFoyer().getIdFoyer());
    }

    @Test
    void desaffecterFoyerAUniversite_removesFoyerLink() {
        Foyer foyer = foyerRepository.save(Foyer.builder().nomFoyer("Foyer A").build());
        Universite universite = universiteService.addUniversite(
                Universite.builder().nomUniversite("ESPRIT").foyer(foyer).build());

        universiteService.desaffecterFoyerAUniversite(universite.getIdUniversite());

        assertNull(universiteService.getUniversiteById(universite.getIdUniversite()).getFoyer());
    }
}