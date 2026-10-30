package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.repositories.ChambreRepository;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for BlocService without Mockito: the real service and repositories
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class BlocServiceIT {

    @Autowired
    IBlocService blocService;

    @Autowired
    ChambreRepository chambreRepository;
/**
 * Test the addBloc method.
 */
    @Test
    void addBloc_persistsBlocWithGeneratedId() {
        Bloc saved = blocService.addBloc(Bloc.builder().nomBloc("A").capaciteBloc(100).build());

        assertTrue(saved.getIdBloc() > 0);
        assertEquals("A", blocService.getBlocById(saved.getIdBloc()).getNomBloc());
    }

    @Test
    void getAllBlocs_returnsSavedBlocs() {
        blocService.addBloc(Bloc.builder().nomBloc("A").build());
        blocService.addBloc(Bloc.builder().nomBloc("B").build());

        List<Bloc> blocs = blocService.getAllBlocs();

        assertEquals(2, blocs.size());
    }

    @Test
    void updateBloc_changesStoredValues() {
        Bloc saved = blocService.addBloc(Bloc.builder().nomBloc("A").capaciteBloc(100).build());

        saved.setCapaciteBloc(200);
        blocService.updateBloc(saved);

        assertEquals(200, blocService.getBlocById(saved.getIdBloc()).getCapaciteBloc());
    }

    @Test
    void deleteBloc_removesBloc() {
        Bloc saved = blocService.addBloc(Bloc.builder().nomBloc("A").build());

        blocService.deleteBloc(saved.getIdBloc());

        assertThrows(NoSuchElementException.class, () -> blocService.getBlocById(saved.getIdBloc()));
    }

    @Test
    void affecterChambresABloc_linksChambresToBloc() {
        Bloc bloc = blocService.addBloc(Bloc.builder().nomBloc("A").build());
        Chambre c1 = chambreRepository.save(Chambre.builder().numeroChambre(101).build());
        Chambre c2 = chambreRepository.save(Chambre.builder().numeroChambre(102).build());

        blocService.affecterChambresABloc(List.of(c1.getIdChambre(), c2.getIdChambre()), bloc.getIdBloc());

        assertEquals(bloc.getIdBloc(), chambreRepository.findById(c1.getIdChambre()).get().getBloc().getIdBloc());
        assertEquals(bloc.getIdBloc(), chambreRepository.findById(c2.getIdChambre()).get().getBloc().getIdBloc());
    }
}
