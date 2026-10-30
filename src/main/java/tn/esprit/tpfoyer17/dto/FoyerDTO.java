package tn.esprit.tpfoyer17.dto;

// Fields a client is allowed to send for a Foyer (blocs and universite have their own routes)
public record FoyerDTO(Long idFoyer, String nomFoyer, long capaciteFoyer) {
}
