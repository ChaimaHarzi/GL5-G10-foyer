package tn.esprit.tpfoyer17.controllers;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import tn.esprit.tpfoyer17.dto.UniversiteRequest;
import tn.esprit.tpfoyer17.entities.Universite;
import tn.esprit.tpfoyer17.services.IUniversiteService;

import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/universites")
public class UniversiteController {
    IUniversiteService universiteService;

    @PostMapping("add")
    public Universite addingUniversite(@RequestBody UniversiteRequest request){
        return universiteService.addUniversite(request.toEntity());
    }
    @GetMapping("getAll")
    public List<Universite> gettingAllUniversite(){
        return universiteService.getAllUniversites();
    }

    @GetMapping("get")
    public Universite gettingUniversite(@RequestParam("idUniversite") long idUniversite){
        return universiteService.getUniversiteById(idUniversite);
    }

    @DeleteMapping("delete/{idUniversite}")
    public void deletingUniversite(@PathVariable("idUniversite") long idUniversite){
        universiteService.deleteUniversite(idUniversite);
    }

    @PutMapping("update")
    public Universite updatingUniversite(@RequestBody UniversiteRequest request){
        Universite universite = universiteService.getUniversiteById(request.idUniversite());
        request.applyTo(universite);
        return universiteService.updateUniversite(universite);
    }

    @PutMapping("affecter-foyer-universite")
    public Universite affecterFoyerAUniversite (@RequestParam("idFoyer") long idFoyer, @RequestParam("nomUniversite") String nomUniversite){
        return universiteService.affecterFoyerAUniversite(idFoyer,nomUniversite);
    }
    @PutMapping("desaffecter-foyer-universite")
    public Universite desaffecterFoyerAUniversite (@RequestParam("idUniversite") long idUniversite){
        return universiteService.desaffecterFoyerAUniversite(idUniversite);

    }
}
