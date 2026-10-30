package tn.esprit.tpfoyer17.dto;

import tn.esprit.tpfoyer17.entities.enumerations.TypeChambre;

// Fields a client is allowed to send for a Chambre (the bloc is assigned with /api/blocs/affecter-chambre-bloc)
public record ChambreDTO(Long idChambre, long numeroChambre, TypeChambre typeChambre) {
}
