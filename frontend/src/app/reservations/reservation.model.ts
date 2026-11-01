import { Etudiant } from '../etudiants/etudiant.model';

// JSON of a reservation. Its chambre is not in it (Chambre.reservations is @JsonIgnore), but the back builds
// the id as idChambre + nomBloc + year (ReservationService.ajouterReservation), so the chambre can be found again.
// estValide = true means the chambre still has free places, not that the reservation is "validated".
export interface Reservation {
  idReservation: string;
  anneeUniversitaire: string | number | null;   // java.util.Date: ISO string (or a timestamp)
  estValide: boolean;
  etudiants: Etudiant[] | null;
}
