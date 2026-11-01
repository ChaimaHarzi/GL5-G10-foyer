import { Bloc } from '../blocs/bloc.model';
import { Chambre } from '../chambres/chambre.model';
import { Reservation } from '../reservations/reservation.model';
import { anneeDe, emplacementDe, placesDe, tauxOccupation } from './occupation';

describe('occupation', () => {
  const c11: Chambre = { idChambre: 11, numeroChambre: 101, typeChambre: 'DOUBLE' };
  const c3: Chambre = { idChambre: 3, numeroChambre: 301, typeChambre: 'TRIPLE' };
  const c1: Chambre = { idChambre: 1, numeroChambre: 1, typeChambre: 'SIMPLE' };
  const blocA: Bloc = { idBloc: 1, nomBloc: 'Bloc A', capaciteBloc: 10, chambres: [c11, c1] };
  const blocB2: Bloc = { idBloc: 2, nomBloc: 'B2', capaciteBloc: 10, chambres: [c3] };
  const reservation = (idReservation: string): Reservation =>
    ({ idReservation, anneeUniversitaire: '2026-10-01T09:00:00.000+00:00', estValide: true, etudiants: [] });

  it('finds the chambre and the bloc from the id built by the back (idChambre + nomBloc + year)', () => {
    expect(emplacementDe(reservation('11Bloc A2026'), [blocA, blocB2])).toEqual({ chambre: c11, bloc: blocA });
    expect(emplacementDe(reservation('1Bloc A2026'), [blocA, blocB2])).toEqual({ chambre: c1, bloc: blocA });
    expect(emplacementDe(reservation('99Bloc A2026'), [blocA, blocB2])).toBeNull();
  });

  it('still finds the chambre when the name of the bloc contains digits', () => {
    expect(emplacementDe(reservation('3B22026'), [blocA, blocB2])).toEqual({ chambre: c3, bloc: blocB2 });
  });

  it('counts the places of the chambres by type and reads the year of a java.util.Date', () => {
    expect(placesDe([c11, c3, c1])).toBe(6);
    expect(placesDe([])).toBe(0);
    expect(anneeDe('2026-10-01T09:00:00.000+00:00')).toBe(2026);
    expect(anneeDe(new Date(2025, 5, 1).getTime())).toBe(2025);
    expect(anneeDe(null)).toBeNull();
  });

  it('computes a rounded occupation rate, 0 when there is no place', () => {
    expect(tauxOccupation(2, 3)).toBe(67);
    expect(tauxOccupation(0, 0)).toBe(0);
  });
});
