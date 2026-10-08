package tn.esprit.tpfoyer17.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import tn.esprit.tpfoyer17.entities.Bloc;
import tn.esprit.tpfoyer17.services.IBlocService;

import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/blocs")
@Tag(name = "Gestion des Blocs",description = "les apis pour gérer tout les Bloc")
public class BlocController {
    IBlocService blocService;

    // Order 1
    @Operation(description = "methode pour ajouter des blocs",summary = "ajouter un bloc",operationId = "1")
    @PostMapping("add")
    public Bloc addingBloc(@RequestBody Bloc bloc){
        return blocService.addBloc(bloc);
    }

    // Order 2
    @GetMapping("getAll")
    public List<Bloc> gettingAllBloc(){
        return blocService.getAllBlocs();
    }

    // Order 3
    @GetMapping("get")
    public Bloc gettingBloc(@RequestParam("idBloc") long idBloc){
        return blocService.getBlocById(idBloc);
    }

    // Order 4
    @DeleteMapping("delete/{idBloc}")
    public void deletingBloc(@PathVariable("idBloc") long idBloc){
        blocService.deleteBloc(idBloc);
    }

    // Order 5
    @PutMapping("update")
    public Bloc updatingBloc(@RequestBody Bloc bloc){
        return blocService.updateBloc(bloc);
    }

    // Order 6
    @PutMapping("affecter-chambre-bloc")
    public Bloc affecterChambresABloc(@RequestBody List<Long> numChambre,@RequestParam("idBloc") long idBloc){
        return blocService.affecterChambresABloc(numChambre,idBloc);
    }




}
