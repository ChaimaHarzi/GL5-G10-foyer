package tn.esprit.tpfoyer17.dto;

import tn.esprit.tpfoyer17.entities.Universite;

/**
 * Body of "add" and "update" for a universite: only the fields a client is allowed to send.
 * The id only says which universite to update (a new universite gets its id from the database),
 * and the foyer is changed by the "affecter" / "desaffecter" endpoints.
 */
public record UniversiteRequest(long idUniversite, String nomUniversite, String adresse) {

    public Universite toEntity() {
        return Universite.builder().nomUniversite(nomUniversite).adresse(adresse).build();
    }

    public void applyTo(Universite universite) {
        universite.setNomUniversite(nomUniversite);
        universite.setAdresse(adresse);
    }
}
