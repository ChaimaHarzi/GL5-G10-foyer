package tn.esprit.tpfoyer17.dto;

import java.time.LocalDate;

// Fields a client is allowed to send for an Etudiant (reservations are managed by /api/reservations)
public record EtudiantDTO(Long idEtudiant, String nomEtudiant, String prenomEtudiant,
                          long cinEtudiant, LocalDate dateNaissance) {
}
