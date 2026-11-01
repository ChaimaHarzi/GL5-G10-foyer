import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { age } from '../shared/age';
import { ToastService } from '../shared/toast/toast.service';
import { Etudiants } from './etudiants';

/**
 * Integration test of the page: real component + template + EtudiantService.
 * Only the HTTP API is simulated.
 */
describe('Etudiants page (integration)', () => {
  const api = '/tpFoyer17/api/etudiants';
  // CIN 01234567: the back stores a long, so the leading 0 is lost
  const amine = { idEtudiant: 5, nomEtudiant: 'Ben Salah', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' };
  const sarra = { idEtudiant: 6, nomEtudiant: 'Trabelsi', prenomEtudiant: 'Sarra', cinEtudiant: 98765432, dateNaissance: null };

  let fixture: ComponentFixture<Etudiants>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Etudiants],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Etudiants);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(etudiants: unknown[], reservations: unknown[] = []): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/getAll`).flush(etudiants);
    httpMock.expectOne('/tpFoyer17/api/reservations/getAll').flush(reservations);
    fixture.detectChanges();
  }

  function cliquer(selecteur: string): void {
    page.querySelector<HTMLElement>(selecteur)!.click();
    fixture.detectChanges();
  }

  function saisir(name: string, valeur: string): void {
    const champ = page.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function remplir(prenom: string, nom: string, cin: string, date: string): void {
    saisir('prenomEtudiant', prenom);
    saisir('nomEtudiant', nom);
    saisir('cinEtudiant', cin);
    saisir('dateNaissance', date);
  }

  const lignes = () => page.querySelectorAll('tr.ligne');
  const texte = (ligne: Element, test: string) => ligne.querySelector(`[data-test="${test}"]`)?.textContent?.trim();

  it('shows the CIN on 8 digits, the birth date as dd/MM/yyyy and the age', () => {
    ouvrirLaPage([amine, sarra]);

    expect(lignes().length).toBe(2);
    expect(lignes()[0].textContent).toContain('Amine Ben Salah');
    expect(texte(lignes()[0], 'cin')).toBe('01234567');
    expect(texte(lignes()[0], 'date')).toBe('15/03/2004');
    expect(texte(lignes()[0], 'age')).toBe(`${age('2004-03-15')} ans`);
    expect(texte(lignes()[1], 'date')).toBe('Non renseignée');
  });

  it('adds an etudiant: the CIN is sent as a number', () => {
    ouvrirLaPage([]);

    cliquer('[data-test="ouvrir-ajout"]');
    remplir('  Amine ', 'Ben Salah', '01234567', '2004-03-15');
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/add`);
    expect(post.request.body).toEqual({ nomEtudiant: 'Ben Salah', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' });
    post.flush(amine);
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(toasts.toasts().at(-1)?.message).toBe('Amine Ben Salah a été ajouté(e).');
  });

  it('refuses a CIN that is not 8 digits, or that another etudiant already has', () => {
    ouvrirLaPage([amine]);

    cliquer('[data-test="ouvrir-ajout"]');
    remplir('Sarra', 'Trabelsi', '1234', '2003-06-01');
    cliquer('form button[type="submit"]');
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('exactement 8 chiffres');

    saisir('cinEtudiant', '01234567');
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('déjà à un autre étudiant');

    httpMock.expectNone(`${api}/add`);
  });

  it('refuses a birth date in the future or a student younger than 16', () => {
    ouvrirLaPage([]);

    cliquer('[data-test="ouvrir-ajout"]');
    remplir('Sarra', 'Trabelsi', '98765432', '2999-01-01');
    cliquer('form button[type="submit"]');
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('dans le futur');

    const ilYa10Ans = `${new Date().getFullYear() - 10}-01-01`;
    saisir('dateNaissance', ilYa10Ans);
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('au moins 16 ans');

    httpMock.expectNone(`${api}/add`);
  });

  it('edits an etudiant: the form shows the CIN on 8 digits and a PUT is sent', () => {
    ouvrirLaPage([amine]);

    cliquer('button.modifier');
    expect(page.querySelector<HTMLInputElement>('input[name="cinEtudiant"]')!.value).toBe('01234567');
    saisir('nomEtudiant', 'Ben Salah Jr');
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/update`);
    expect(put.request.body).toEqual({ idEtudiant: 5, nomEtudiant: 'Ben Salah Jr', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' });
    put.flush({ ...amine, nomEtudiant: 'Ben Salah Jr' });
    fixture.detectChanges();

    expect(lignes()[0].textContent).toContain('Amine Ben Salah Jr');
  });

  it('shows the reservation of each etudiant, rebuilt from Reservation.etudiants', () => {
    ouvrirLaPage([amine, sarra], [{ idReservation: '11Bloc A2026', anneeUniversitaire: '2026-10-01T09:00:00.000+00:00', estValide: true, etudiants: [amine] }]);

    expect(texte(lignes()[0], 'reservation')).toBe('11Bloc A2026');
    expect(texte(lignes()[1], 'reservation')).toBe('Aucune');
  });

  it('does not allow deleting an etudiant who has a reservation', () => {
    ouvrirLaPage([amine, sarra], [{ idReservation: '11Bloc A2026', anneeUniversitaire: '2026-10-01T09:00:00.000+00:00', estValide: true, etudiants: [amine] }]);

    const boutons = page.querySelectorAll<HTMLButtonElement>('button.supprimer');
    expect(boutons[0].disabled).toBeTrue();
    expect(boutons[0].title).toContain('réservations');
    expect(boutons[1].disabled).toBeFalse();
  });

  it('keeps the etudiant and explains why when the back refuses the deletion (reservations)', () => {
    ouvrirLaPage([amine]);

    cliquer('button.supprimer');
    cliquer('[data-test="confirmer"]');
    // Spring's default JSON error for a database constraint
    httpMock.expectOne(`${api}/delete/5`).flush(
      { status: 500, error: 'Internal Server Error', path: '/tpFoyer17/api/etudiants/delete/5' },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(toasts.toasts().at(-1)).toEqual(jasmine.objectContaining({ type: 'erreur', message: jasmine.stringContaining('réservations') }));
  });
});
