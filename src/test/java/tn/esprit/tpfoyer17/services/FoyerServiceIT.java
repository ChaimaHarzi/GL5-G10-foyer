package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.repositories.UniversiteRepository;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for FoyerService without Mockito: the real service and repositories
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class FoyerServiceIT {

    @Autowired
    IFoyerService foyerService;

    @Autowired
    UniversiteRepository universiteRepository;

    @Test
    void addFoyer_persistsFoyerWithGeneratedId() {
        Foyer saved = foyerService.addFoyer(Foyer.builder().nomFoyer("Foyer A").capaciteFoyer(500).build());

        assertTrue(saved.getIdFoyer() > 0);
        assertEquals("Foyer A", foyerService.getFoyerById(saved.getIdFoyer()).getNomFoyer());
    }

    @Test
    void getAllFoyers_returnsSavedFoyers() {
        foyerService.addFoyer(Foyer.builder().nomFoyer("Foyer A").build());
        foyerService.addFoyer(Foyer.builder().nomFoyer("Foyer B").build());

        List<Foyer> foyers = foyerService.getAllFoyers();

        assertEquals(2, foyers.size());
    }

    @Test
    void updateFoyer_changesStoredValues() {
        Foyer saved = foyerService.addFoyer(Foyer.builder().nomFoyer("Foyer A").capaciteFoyer(500).build());

        saved.setCapaciteFoyer(800);
        foyerService.updateFoyer(saved);

        assertEquals(800, foyerService.getFoyerById(saved.getIdFoyer()).getCapaciteFoyer());
    }

    @Test
    void deleteFoyer_removesFoyer() {
        Foyer saved = foyerService.addFoyer(Foyer.builder().nomFoyer("Foyer A").build());

        foyerService.deleteFoyer(saved.getIdFoyer());

        assertThrows(NoSuchElementException.class, () -> foyerService.getFoyerById(saved.getIdFoyer()));
    }

    @Test
    void ajouterFoyerEtAffecterAUniversite_persistsFoyerAndLinksItToUniversite() {
        Universite universite = universiteRepository.save(Universite.builder().nomUniversite("ESPRIT").build());

        Foyer saved = foyerService.ajouterFoyerEtAffecterAUniversite(
                Foyer.builder().nomFoyer("Foyer ESPRIT").build(), universite.getIdUniversite());

        assertTrue(saved.getIdFoyer() > 0);
        Universite reloaded = universiteRepository.findById(universite.getIdUniversite()).get();
        assertNotNull(reloaded.getFoyer());
        assertEquals(saved.getIdFoyer(), reloaded.getFoyer().getIdFoyer());
    }
}
