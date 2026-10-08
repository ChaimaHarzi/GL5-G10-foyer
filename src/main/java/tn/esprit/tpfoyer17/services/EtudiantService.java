package tn.esprit.tpfoyer17.services;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.tpfoyer17.entities.Etudiant;
import tn.esprit.tpfoyer17.repositories.EtudiantRepository;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EtudiantService implements IEtudiantService{
    EtudiantRepository etudiantRepository;

    @Override
    public Etudiant addEtudiant(Etudiant etudiant) {
        return etudiantRepository.save(etudiant);


    }
    @Override
    public List<Etudiant> getAllEtudiants() {
        return (List<Etudiant>) etudiantRepository.findAll();
    }
    @Override
    public Etudiant getEtudiantById(long idEtudiant) {
        return etudiantRepository.findById(idEtudiant).get();
    }
    @Override
    public void deleteEtudiant(long idEtudiant) {
        etudiantRepository.deleteById(idEtudiant);
    }
    @Override
    public Etudiant updateEtudiant(Etudiant etudiant) {
        return etudiantRepository.save(etudiant);
    }
   
}
