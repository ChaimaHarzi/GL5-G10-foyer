import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MESSAGE_SERVEUR_INJOIGNABLE } from '../shared/api-error';
import { TableauDeBord } from './tableau-de-bord';

/**
 * Integration test of the dashboard: real component + template + the 6 services.
 * Only the HTTP API is simulated.
 */
describe('Tableau de bord (integration)', () => {
  const api = '/tpFoyer17/api';
  const annee = new Date().getFullYear();
  const amine = { idEtudiant: 5, nomEtudiant: 'Ben Salah', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' };
  const sarra = { idEtudiant: 6, nomEtudiant: 'Trabelsi', prenomEtudiant: 'Sarra', cinEtudiant: 98765432, dateNaissance: '2003-06-01' };
  const karim = { idEtudiant: 7, nomEtudiant: 'Jaziri', prenomEtudiant: 'Karim', cinEtudiant: 55555555, dateNaissance: '2005-01-20' };
  const c101 = { idChambre: 11, numeroChambre: 101, typeChambre: 'DOUBLE' };
  const c102 = { idChambre: 12, numeroChambre: 102, typeChambre: 'SIMPLE' };
  const c201 = { idChambre: 21, numeroChambre: 201, typeChambre: 'TRIPLE' };
  const blocA = { idBloc: 3, nomBloc: 'Bloc A', capaciteBloc: 60, foyer: null, chambres: [c101, c102] };
  const blocB = { idBloc: 5, nomBloc: 'Bloc B', capaciteBloc: 40, foyer: null, chambres: [c201] };
  const reservation = { idReservation: `11Bloc A${annee}`, anneeUniversitaire: `${annee}-10-01T09:00:00.000+00:00`, estValide: false, etudiants: [amine, sarra] };
  // A reservation of a past year is not counted in the occupation of this year
  const ancienne = { idReservation: '21Bloc B2020', anneeUniversitaire: '2020-10-01T09:00:00.000+00:00', estValide: true, etudiants: [karim] };

  let fixture: ComponentFixture<TableauDeBord>;
  let httpMock: HttpTestingController;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauDeBord],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(TableauDeBord);
    httpMock = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/universites/getAll`).flush([{ idUniversite: 1, nomUniversite: 'FST', adresse: 'Tunis', foyer: null }]);
    httpMock.expectOne(`${api}/foyers/getAll`).flush([{ idFoyer: 4, nomFoyer: 'El Amal', capaciteFoyer: 300 }]);
    httpMock.expectOne(`${api}/blocs/getAll`).flush([blocA, blocB]);
    httpMock.expectOne(`${api}/chambres/getAll`).flush([c101, c102, c201]);
    httpMock.expectOne(`${api}/etudiants/getAll`).flush([amine, sarra, karim]);
    httpMock.expectOne(`${api}/reservations/getAll`).flush([reservation, ancienne]);
    fixture.detectChanges();
  }

  const texte = (test: string) => page.querySelector(`[data-test="${test}"]`)?.textContent?.replace(/\s+/g, ' ').trim();
  const valeurs = (test: string) => Array.from(page.querySelectorAll(`[data-test="${test}"] .barre-valeur`)).map(e => e.textContent?.trim());

  it('shows one indicator per entity, the reservations being those of this year', () => {
    ouvrirLaPage();

    const kpi = Array.from(page.querySelectorAll('[data-test="valeur"]')).map(e => e.textContent?.trim());
    expect(kpi).toEqual(['1', '1', '2', '3', '3', '1']);
  });

  it('computes the occupation rate from the capacity of each type of chambre', () => {
    ouvrirLaPage();

    // DOUBLE 2 + SIMPLE 1 + TRIPLE 3 = 6 places, 2 occupied this year
    expect(texte('taux')).toBe('33 %');
    expect(texte('places')).toBe('2 place(s) occupée(s) sur 6');
  });

  it('draws the chambres by type and the occupation of each bloc', () => {
    ouvrirLaPage();

    expect(valeurs('par-type')).toEqual(['1', '1', '1']);
    // Bloc A: 2 occupied out of 3 places; Bloc B: its only reservation is from 2020
    expect(valeurs('par-bloc')).toEqual(['67 %', '0 %']);
    expect(page.querySelector('[data-test="par-bloc"] .barre')?.getAttribute('title')).toBe('2/3 places occupées');
  });

  it('lists the students who have no reservation this year', () => {
    ouvrirLaPage();

    expect(texte('nb-sans-reservation')).toBe('1');
    expect(page.querySelector('.liste-etudiants')?.textContent).toContain('Karim Jaziri');
    expect(page.querySelector('.liste-etudiants')?.textContent).toContain('CIN 55555555');
  });

  it('shows an error with a retry button when the API cannot be reached', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/universites/getAll`).flush('', { status: 503, statusText: 'Service Unavailable' });
    // forkJoin stops at the first error: the 5 other requests are cancelled, take them out of the mock
    httpMock.match(r => r.url.startsWith(api));
    fixture.detectChanges();

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(MESSAGE_SERVEUR_INJOIGNABLE);
    expect(page.querySelector('[data-test="reessayer"]')).not.toBeNull();
  });
});
