import { Bloc } from '../blocs/bloc.model';
import { Chambre, TypeChambre } from '../chambres/chambre.model';
import { Reservation } from '../reservations/reservation.model';

// Number of students a chambre can host
export const CAPACITE_TYPE: Record<TypeChambre, number> = { SIMPLE: 1, DOUBLE: 2, TRIPLE: 3 };

export interface Emplacement {
  chambre: Chambre;
  bloc: Bloc;
}

export function placesDe(chambres: readonly Chambre[]): number {
  return chambres.reduce((somme, c) => somme + CAPACITE_TYPE[c.typeChambre], 0);
}

// Year of a java.util.Date sent by the back: "2026-11-01T10:00:00.000+00:00" or a timestamp
export function anneeDe(date: string | number | null): number | null {
  if (date === null || date === undefined) {
    return null;
  }
  return typeof date === 'number' ? new Date(date).getFullYear() : Number(date.slice(0, 4));
}

// The back builds the id as idChambre + nomBloc + year: "11Bloc A2026" is chambre 11 of "Bloc A"
export function emplacementDe(reservation: Reservation, blocs: readonly Bloc[]): Emplacement | null {
  const id = reservation.idReservation;
  for (const bloc of blocs) {
    for (const chambre of bloc.chambres ?? []) {
      const prefixe = `${chambre.idChambre}${bloc.nomBloc}`;
      if (id.length === prefixe.length + 4 && id.startsWith(prefixe) && /^\d{4}$/.test(id.slice(prefixe.length))) {
        return { chambre, bloc };
      }
    }
  }
  return null;
}

// Percentage of occupied places, rounded; 0 when there is no place at all
export function tauxOccupation(occupees: number, places: number): number {
  return places > 0 ? Math.round((occupees / places) * 100) : 0;
}
