package tn.esprit.tpfoyer17.controllers;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import tn.esprit.tpfoyer17.entities.Foyer;
import tn.esprit.tpfoyer17.services.IFoyerService;

import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/foyers")
public class FoyerController {
    IFoyerService foyerService;

    @PostMapping("add")
    public Foyer addingFoyer(@RequestBody Foyer foyer){
        return foyerService.addFoyer(foyer);
    }
    @GetMapping("getAll")
    public List<Foyer> gettingAllFoyer(){
        return foyerService.getAllFoyers();
    }

    @GetMapping("get")
    public Foyer gettingFoyer(@RequestParam("idFoyer") long idFoyer){
        return foyerService.getFoyerById(idFoyer);
    }

    @DeleteMapping("delete/{idFoyer}")
    public void deletingFoyer(@PathVariable("idFoyer") long idFoyer){
        foyerService.deleteFoyer(idFoyer);
    }

    @PutMapping("update")
    public Foyer updatingFoyer(@RequestBody Foyer foyer){
        return foyerService.updateFoyer(foyer);
    }
    @PostMapping("ajouter-affecter")
    Foyer ajouterFoyerEtAffecterAUniversite (@RequestBody Foyer foyer, @RequestParam("idUniversite") long idUniversite){
        return foyerService.ajouterFoyerEtAffecterAUniversite(foyer,idUniversite);
    }

}
