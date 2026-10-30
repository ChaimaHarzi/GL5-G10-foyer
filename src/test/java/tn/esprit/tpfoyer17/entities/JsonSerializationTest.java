package tn.esprit.tpfoyer17.entities;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Checks that entities returned by the REST API can be converted to JSON,
 * like Spring does in the controllers (no Spring context, no database).
 */
class JsonSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** A reservation and a student pointing to each other, as loaded from the database. */
    private Reservation reservationAvecEtudiant() {
        Etudiant etudiant = Etudiant.builder().nomEtudiant("Ali").cinEtudiant(111).build();
        Reservation reservation = Reservation.builder()
                .idReservation("5A2026")
                .anneeUniversitaire(new Date())
                .estValide(true)
                .etudiants(new HashSet<>(Set.of(etudiant)))
                .build();
        etudiant.setReservations(new HashSet<>(Set.of(reservation)));
        return reservation;
    }

    @Test
    void reservationWithEtudiant_isSerializedWithoutInfiniteRecursion() {
        String json = assertDoesNotThrow(() -> objectMapper.writeValueAsString(reservationAvecEtudiant()));

        assertTrue(json.contains("\"idReservation\":\"5A2026\""));
        assertTrue(json.contains("\"nomEtudiant\":\"Ali\""));
    }

    @Test
    void etudiantWithReservation_isSerializedWithoutInfiniteRecursion() {
        Etudiant etudiant = reservationAvecEtudiant().getEtudiants().iterator().next();

        String json = assertDoesNotThrow(() -> objectMapper.writeValueAsString(etudiant));

        assertTrue(json.contains("\"cinEtudiant\":111"));
        assertFalse(json.contains("reservations"));
    }
}
