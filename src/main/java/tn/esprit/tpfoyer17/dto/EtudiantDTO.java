package tn.esprit.tpfoyer17.dto;

import java.util.Date;

// Fields a client is allowed to send for an Etudiant (reservations are managed by /api/reservations)
public record EtudiantDTO(Long idEtudiant, String nomEtudiant, String prenomEtudiant,
                          long cinEtudiant, Date dateNaissance) {
}
