package tn.esprit.tpfoyer17.dto;

import tn.esprit.tpfoyer17.entities.Bloc;

/**
 * Body of "add" and "update" for a bloc: only the fields a client is allowed to send.
 * The id only says which bloc to update (a new bloc gets its id from the database),
 * and the relations (foyer, chambres) are changed by their own endpoints.
 */
public record BlocRequest(long idBloc, String nomBloc, long capaciteBloc) {

    public Bloc toEntity() {
        return Bloc.builder().nomBloc(nomBloc).capaciteBloc(capaciteBloc).build();
    }

    public void applyTo(Bloc bloc) {
        bloc.setNomBloc(nomBloc);
        bloc.setCapaciteBloc(capaciteBloc);
    }
}
