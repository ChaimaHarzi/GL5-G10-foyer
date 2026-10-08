package tn.esprit.tpfoyer17.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.util.Date;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Etudiant implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    long idEtudiant;

    String nomEtudiant;

    String prenomEtudiant;

    long cinEtudiant;

    Date dateNaissance;

    @ToString.Exclude
    @ManyToMany(mappedBy = "etudiants")
    Set<Reservation> reservations;

}
