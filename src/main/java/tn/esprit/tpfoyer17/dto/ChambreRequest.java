package tn.esprit.tpfoyer17.dto;

import tn.esprit.tpfoyer17.entities.Chambre;
import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;

/**
 * Body of "add" and "update" for a chambre: only the fields a client is allowed to send.
 * The id only says which chambre to update (a new chambre gets its id from the database),
 * and the relations (bloc, reservations) are changed by their own endpoints.
 */
public record ChambreRequest(long idChambre, long numeroChambre, TypeChambre typeChambre) {

    public Chambre toEntity() {
        return Chambre.builder().numeroChambre(numeroChambre).typeChambre(typeChambre).build();
    }

    public void applyTo(Chambre chambre) {
        chambre.setNumeroChambre(numeroChambre);
        chambre.setTypeChambre(typeChambre);
    }
}
