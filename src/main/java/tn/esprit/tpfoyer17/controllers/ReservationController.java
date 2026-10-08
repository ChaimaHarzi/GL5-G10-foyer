package tn.esprit.tpfoyer17.controllers;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import tn.esprit.tpfoyer17.entities.Reservation;
import tn.esprit.tpfoyer17.services.IReservationService;

import java.util.Date;
import java.util.List;

@RestController
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequestMapping("api/reservations")
public class ReservationController {
    IReservationService reservationService;


    @GetMapping("getAll")
    public List<Reservation> gettingAllReservation(){
        return reservationService.getAllReservations();
    }

    @GetMapping("get")
    public Reservation gettingReservation(@RequestParam("idReservation") String idReservation){
        return reservationService.getReservationById(idReservation);
    }

    @DeleteMapping("delete/{idReservation}")
    public void deletingReservation(@PathVariable("idReservation") String idReservation){
        reservationService.deleteReservation(idReservation);
    }

    @PutMapping("update")
    public Reservation updatingReservation(@RequestBody Reservation reservation){
        return reservationService.updateReservation(reservation);
    }

    @PutMapping("ajouter-reservation")
    public Reservation ajouterReservation (@RequestParam("idChambre") long idChambre, @RequestParam("cinEtudiant") long cinEtudiant){
        return reservationService.ajouterReservation(idChambre,cinEtudiant);
    }
    @PutMapping("annuler-reservation")
    public Reservation annulerReservation (@RequestParam("cinEtudiant") long cinEtudiant){
        return reservationService.annulerReservation(cinEtudiant);
    }
    @GetMapping("get-reservation-annee-universitaire-nom-universitaire")
    public List<Reservation>  getReservationParAnneeUniversitaireEtNomUniversite(@RequestParam("anneeUniversite") Date anneeUniversite, @RequestParam("nomUniversite") String nomUniversite){
        return reservationService.getReservationParAnneeUniversitaireEtNomUniversite(anneeUniversite,nomUniversite);
    }
}
