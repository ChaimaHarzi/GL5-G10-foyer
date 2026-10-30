package tn.esprit.tpfoyer17.dto;

// Fields a client is allowed to send for a Bloc (no rooms, no foyer object, just its id)
public record BlocDTO(Long idBloc, String nomBloc, long capaciteBloc, Long idFoyer) {
}
