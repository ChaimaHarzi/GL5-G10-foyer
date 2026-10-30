package tn.esprit.tpfoyer17.dto;

import tn.esprit.tpfoyer17.entities.Foyer;

/**
 * Body of "add", "update" and "ajouter-affecter" for a foyer: only the fields a client is allowed to send.
 * The id only says which foyer to update (a new foyer gets its id from the database),
 * and the relations (universite, blocs) are changed by their own endpoints.
 */
public record FoyerRequest(long idFoyer, String nomFoyer, long capaciteFoyer) {

    public Foyer toEntity() {
        return Foyer.builder().nomFoyer(nomFoyer).capaciteFoyer(capaciteFoyer).build();
    }

    public void applyTo(Foyer foyer) {
        foyer.setNomFoyer(nomFoyer);
        foyer.setCapaciteFoyer(capaciteFoyer);
    }
}
