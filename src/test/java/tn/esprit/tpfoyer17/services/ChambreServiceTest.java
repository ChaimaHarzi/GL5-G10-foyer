package tn.esprit.tpfoyer17.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;
import tn.esprit.tpfoyer17.repositories.BlocRepository;
import tn.esprit.tpfoyer17.repositories.FoyerRepository;
import tn.esprit.tpfoyer17.repositories.UniversiteRepository;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ChambreService without Mockito: the real service and repositories
 * run against an H2 in-memory database (see src/test/resources/application.properties).
 * Each test is rolled back at the end thanks to @Transactional.
 */
@SpringBootTest
@Transactional
class ChambreServiceTest {

    @Autowired
    IChambreService chambreService;

    @Autowired
    BlocRepository blocRepository;

    @Autowired
    FoyerRepository foyerRepository;

    @Autowired
    UniversiteRepository universiteRepository;

    /** Creates Universite -> Foyer -> Bloc, the hierarchy a Chambre belongs to. */
    private Bloc createBlocInUniversite(String nomUniversite) {
        Foyer foyer = foyerRepository.save(Foyer.builder().nomFoyer("Foyer " + nomUniversite).build());
        universiteRepository.save(Universite.builder().nomUniversite(nomUniversite).foyer(foyer).build());
        return blocRepository.save(Bloc.builder().nomBloc("Bloc " + nomUniversite).foyer(foyer).build());
    }

    @Test
    void addChambre_persistsChambreWithGeneratedId() {
        Chambre saved = chambreService.addChambre(
                Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).build());

        assertTrue(saved.getIdChambre() > 0);
        assertEquals(101, chambreService.getChambreById(saved.getIdChambre()).getNumeroChambre());
    }

    @Test
    void getAllChambres_returnsSavedChambres() {
        chambreService.addChambre(Chambre.builder().numeroChambre(101).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(102).build());

        List<Chambre> chambres = chambreService.getAllChambres();

        assertEquals(2, chambres.size());
    }

    @Test
    void updateChambre_changesStoredValues() {
        Chambre saved = chambreService.addChambre(
                Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).build());

        saved.setTypeChambre(TypeChambre.DOUBLE);
        chambreService.updateChambre(saved);

        assertEquals(TypeChambre.DOUBLE, chambreService.getChambreById(saved.getIdChambre()).getTypeChambre());
    }

    @Test
    void deleteChambre_removesChambre() {
        Chambre saved = chambreService.addChambre(Chambre.builder().numeroChambre(101).build());

        chambreService.deleteChambre(saved.getIdChambre());

        assertThrows(NoSuchElementException.class, () -> chambreService.getChambreById(saved.getIdChambre()));
    }

    @Test
    void getChambresParNomUniversite_returnsOnlyChambresOfThatUniversite() {
        Bloc blocEsprit = createBlocInUniversite("ESPRIT");
        Bloc blocAutre = createBlocInUniversite("AUTRE");
        chambreService.addChambre(Chambre.builder().numeroChambre(101).bloc(blocEsprit).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(102).bloc(blocEsprit).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(201).bloc(blocAutre).build());

        List<Chambre> result = chambreService.getChambresParNomUniversite("ESPRIT");

        assertEquals(2, result.size());
    }

    @Test
    void getChambresParBlocEtTypeKeyWord_filtersByBlocAndType() {
        Bloc bloc = createBlocInUniversite("ESPRIT");
        chambreService.addChambre(Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).bloc(bloc).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(102).typeChambre(TypeChambre.DOUBLE).bloc(bloc).build());

        List<Chambre> result = chambreService.getChambresParBlocEtTypeKeyWord(bloc.getIdBloc(), TypeChambre.SIMPLE);

        assertEquals(1, result.size());
        assertEquals(101, result.get(0).getNumeroChambre());
    }

    @Test
    void getChambresParBlocEtTypeJPQL_filtersByBlocAndType() {
        Bloc bloc = createBlocInUniversite("ESPRIT");
        chambreService.addChambre(Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).bloc(bloc).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(102).typeChambre(TypeChambre.DOUBLE).bloc(bloc).build());

        List<Chambre> result = chambreService.getChambresParBlocEtTypeJPQL(bloc.getIdBloc(), TypeChambre.DOUBLE);

        assertEquals(1, result.size());
        assertEquals(102, result.get(0).getNumeroChambre());
    }

    @Test
    void keyWordAndJPQL_returnSameResult() {
        Bloc bloc = createBlocInUniversite("ESPRIT");
        chambreService.addChambre(Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.TRIPLE).bloc(bloc).build());
        chambreService.addChambre(Chambre.builder().numeroChambre(102).typeChambre(TypeChambre.TRIPLE).bloc(bloc).build());

        assertEquals(
                chambreService.getChambresParBlocEtTypeKeyWord(bloc.getIdBloc(), TypeChambre.TRIPLE).size(),
                chambreService.getChambresParBlocEtTypeJPQL(bloc.getIdBloc(), TypeChambre.TRIPLE).size());
    }

    @Test
    void getChambresNonReserveParNomUniversiteEtTypeChambre_noReservations_returnsEmpty() {
        Bloc bloc = createBlocInUniversite("ESPRIT");
        chambreService.addChambre(Chambre.builder().numeroChambre(101).typeChambre(TypeChambre.SIMPLE).bloc(bloc).build());

        List<Chambre> result =
                chambreService.getChambresNonReserveParNomUniversiteEtTypeChambre("ESPRIT", TypeChambre.SIMPLE);

        assertTrue(result.isEmpty());
    }
}
