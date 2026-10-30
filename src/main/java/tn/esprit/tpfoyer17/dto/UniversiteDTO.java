package tn.esprit.tpfoyer17.dto;

// Fields a client is allowed to send for a Universite (the foyer is managed by affecter/desaffecter-foyer-universite)
public record UniversiteDTO(Long idUniversite, String nomUniversite, String adresse) {
}
