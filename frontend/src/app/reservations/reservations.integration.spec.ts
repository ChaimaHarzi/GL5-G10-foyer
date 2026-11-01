import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../shared/toast/toast.service';
import { Reservations } from './reservations';

/**
 * Integration test of the page: real component + template + ReservationService, EtudiantService, BlocService.
 * Only the HTTP API is simulated. The chambre of a reservation is found again from its id.
 */
describe('Reservations page (integration)', () => {
  const api = '/tpFoyer17/api';
  const annee = new Date().getFullYear();
  const date = `${annee}-10-01T09:00:00.000+00:00`;
  const amine = { idEtudiant: 5, nomEtudiant: 'Ben Salah', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' };
  const sarra = { idEtudiant: 6, nomEtudiant: 'Trabelsi', prenomEtudiant: 'Sarra', cinEtudiant: 98765432, dateNaissance: '2003-06-01' };
  const karim = { idEtudiant: 7, nomEtudiant: 'Jaziri', prenomEtudiant: 'Karim', cinEtudiant: 55555555, dateNaissance: '2005-01-20' };
  const c101 = { idChambre: 11, numeroChambre: 101, typeChambre: 'DOUBLE' };
  const c102 = { idChambre: 12, numeroChambre: 102, typeChambre: 'SIMPLE' };
  const blocA = { idBloc: 3, nomBloc: 'Bloc A', capaciteBloc: 60, foyer: null, chambres: [c101, c102] };
  const blocVide = { idBloc: 4, nomBloc: 'Bloc vide', capaciteBloc: 10, foyer: null, chambres: [] };
  const rDouble = { idReservation: `11Bloc A${annee}`, anneeUniversitaire: date, estValide: true, etudiants: [amine] };
  const rSimple = { idReservation: `12Bloc A${annee}`, anneeUniversitaire: date, estValide: false, etudiants: [sarra] };

  let fixture: ComponentFixture<Reservations>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservations],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Reservations);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(reservations: unknown[], etudiants: unknown[] = [amine, sarra, karim], blocs: unknown[] = [blocA, blocVide]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/reservations/getAll`).flush(reservations);
    httpMock.expectOne(`${api}/etudiants/getAll`).flush(etudiants);
    httpMock.expectOne(`${api}/blocs/getAll`).flush(blocs);
    fixture.detectChanges();
  }

  function cliquer(selecteur: string): void {
    page.querySelector<HTMLElement>(selecteur)!.click();
    fixture.detectChanges();
  }

  function choisir(name: string, index: number): void {
    const select = page.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  const options = (name: string) =>
    Array.from(page.querySelectorAll(`select[name="${name}"] option`)).map(o => o.textContent?.replace(/\s+/g, ' ').trim());
  const lignes = () => page.querySelectorAll('tr.ligne');
  const texte = (ligne: Element, test: string) => ligne.querySelector(`[data-test="${test}"]`)?.textContent?.replace(/\s+/g, ' ').trim();
  const valeursStats = () => Array.from(page.querySelectorAll('[data-test="valeur"]')).map(e => e.textContent?.trim());

  it('shows the chambre found from the id, the occupants out of the capacity and the status', () => {
    ouvrirLaPage([rSimple, rDouble]);

    expect(lignes().length).toBe(2);
    expect(texte(lignes()[0], 'chambre')).toContain('Chambre 101');
    expect(texte(lignes()[0], 'chambre')).toContain('Bloc A · DOUBLE');
    expect(texte(lignes()[0], 'occupation')).toBe('1/2');
    expect(texte(lignes()[0], 'statut')).toBe('Places libres');
    expect(texte(lignes()[1], 'occupation')).toBe('1/1');
    expect(texte(lignes()[1], 'statut')).toBe('Complète');
    // 2 reservations, 2 students housed, 3 places in Bloc A - 2 = 1 free
    expect(valeursStats()).toEqual(['2', '2', '1']);
  });

  it('filters by status and searches by CIN', () => {
    ouvrirLaPage([rDouble, rSimple]);

    cliquer('button[data-statut="completes"]');
    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Sarra Trabelsi');

    cliquer('button[data-statut="toutes"]');
    const recherche = page.querySelector<HTMLInputElement>('input[name="recherche"]')!;
    recherche.value = '01234567';
    recherche.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Amine Ben Salah');
  });

  it('only offers the students without reservation this year and the blocs that have chambres', () => {
    ouvrirLaPage([rDouble, rSimple]);

    cliquer('[data-test="ouvrir-ajout"]');

    expect(options('cinEtudiant')).toEqual(['Choisir un étudiant…', 'Karim Jaziri · CIN 55555555']);
    expect(options('idBloc')).toEqual(['Choisir un bloc…', 'Bloc A (2 chambre(s))']);
  });

  it('reserves in a bloc: the bloc id goes in "idChambre", then the list is reloaded', () => {
    ouvrirLaPage([rDouble, rSimple]);

    cliquer('[data-test="ouvrir-ajout"]');
    choisir('cinEtudiant', 1);
    choisir('idBloc', 1);
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/reservations/ajouter-reservation?idChambre=3&cinEtudiant=55555555`);
    expect(put.request.method).toBe('PUT');
    const complete = { ...rDouble, estValide: false, etudiants: [amine, karim] };
    put.flush(complete);
    httpMock.expectOne(`${api}/reservations/getAll`).flush([complete, rSimple]);
    fixture.detectChanges();

    expect(page.querySelector('[role="dialog"]')).toBeNull();
    expect(texte(lignes()[0], 'occupation')).toBe('2/2');
    expect(texte(lignes()[0], 'statut')).toBe('Complète');
    expect(toasts.toasts().at(-1)?.message).toBe(`Réservation 11Bloc A${annee} enregistrée pour Karim Jaziri.`);
  });

  it('shows the reason sent by the back when the reservation is refused', () => {
    ouvrirLaPage([]);

    cliquer('[data-test="ouvrir-ajout"]');
    choisir('cinEtudiant', 1);
    choisir('idBloc', 1);
    cliquer('form button[type="submit"]');

    httpMock.expectOne(r => r.url === `${api}/reservations/ajouter-reservation`).flush(
      { title: 'Conflict', status: 409, detail: 'Aucune chambre disponible dans le bloc 3' },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    expect(toasts.toasts().at(-1)).toEqual(jasmine.objectContaining({ type: 'erreur', message: 'Aucune chambre disponible dans le bloc 3' }));
    expect(page.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('cancels the reservation of a student after confirmation: his place becomes free', () => {
    ouvrirLaPage([rDouble]);

    cliquer('button.annuler[data-cin="1234567"]');
    expect(page.querySelector('[role="dialog"]')?.textContent).toContain('Amine Ben Salah (CIN 01234567)');
    cliquer('[data-test="confirmer"]');

    const put = httpMock.expectOne(`${api}/reservations/annuler-reservation?cinEtudiant=1234567`);
    put.flush({ ...rDouble, etudiants: [], estValide: true });
    fixture.detectChanges();

    expect(texte(lignes()[0], 'occupation')).toBe('0/2');
    expect(lignes()[0].textContent).toContain('Aucun occupant');
    expect(toasts.toasts().at(-1)?.type).toBe('succes');
  });

  it('does not offer to cancel a reservation of a past year (the back only cancels the current one)', () => {
    const ancienne = { idReservation: '11Bloc A2020', anneeUniversitaire: '2020-10-01T09:00:00.000+00:00', estValide: false, etudiants: [karim] };
    ouvrirLaPage([ancienne]);

    expect(lignes()[0].textContent).toContain('Année 2020');
    expect(page.querySelector('button.annuler')).toBeNull();
  });
});
