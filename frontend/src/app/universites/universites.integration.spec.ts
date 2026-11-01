import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../shared/toast/toast.service';
import { Universites } from './universites';

/**
 * Integration test of the page: real component + real template + real UniversiteService + real ToastService.
 * Only the HTTP API is simulated (HttpTestingController), like H2 replaces MySQL in the *IT tests of the back.
 * The test acts like a user: it clicks the buttons and types in the form.
 */
describe('Universites page (integration)', () => {
  const api = '/tpFoyer17/api/universites';
  const fst = { idUniversite: 1, nomUniversite: 'FST', adresse: 'El Manar', foyer: { idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 300 } };
  const enit = { idUniversite: 7, nomUniversite: 'ENIT', adresse: 'Tunis', foyer: null };

  let fixture: ComponentFixture<Universites>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Universites],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Universites);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  /** Opens the page: it loads the list, the fake API answers with the given universites */
  function ouvrirLaPage(universites: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/getAll`).flush(universites);
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

  const lignes = () => page.querySelectorAll('tr.ligne');
  const dernierToast = () => toasts.toasts().at(-1);

  it('shows the universites stored in the back, with their foyer', () => {
    ouvrirLaPage([fst, enit]);

    expect(lignes().length).toBe(2);
    expect(lignes()[0].textContent).toContain('Foyer El Amal');
    expect(lignes()[1].textContent).toContain('Non affecté');
  });

  it('adds a universite from the modal form', () => {
    ouvrirLaPage([fst]);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('nomUniversite', '  ENIT  ');
    saisir('adresse', 'Tunis');
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/add`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nomUniversite: 'ENIT', adresse: 'Tunis' });
    post.flush(enit);
    fixture.detectChanges();

    expect(lignes().length).toBe(2);
    expect(lignes()[1].textContent).toContain('ENIT');
    expect(page.querySelector('[role="dialog"]')).toBeNull();
    expect(dernierToast()).toEqual(jasmine.objectContaining({ type: 'succes', message: '« ENIT » a été ajoutée.' }));
  });

  it('does not call the API when the form is empty and shows the field errors', () => {
    ouvrirLaPage([]);

    cliquer('[data-test="ouvrir-ajout"]');
    cliquer('form button[type="submit"]');

    httpMock.expectNone(`${api}/add`);
    expect(page.querySelectorAll('.erreur-champ').length).toBe(2);
    expect(page.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('edits a universite: the form is pre-filled and a PUT is sent', () => {
    ouvrirLaPage([fst]);

    cliquer('button.modifier');
    expect(page.querySelector<HTMLInputElement>('input[name="nomUniversite"]')!.value).toBe('FST');

    saisir('nomUniversite', 'FST Tunis');
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/update`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ idUniversite: 1, nomUniversite: 'FST Tunis', adresse: 'El Manar' });
    put.flush({ ...fst, nomUniversite: 'FST Tunis' });
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('FST Tunis');
    expect(lignes()[0].textContent).toContain('Foyer El Amal');
  });

  it('deletes a universite only after the confirmation', () => {
    ouvrirLaPage([enit]);

    cliquer('button.supprimer');
    httpMock.expectNone(`${api}/delete/7`);
    expect(page.querySelector('[role="dialog"]')?.textContent).toContain('ENIT');

    cliquer('[data-test="confirmer"]');
    const del = httpMock.expectOne(`${api}/delete/7`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
    fixture.detectChanges();

    expect(lignes().length).toBe(0);
    expect(page.querySelector('[data-test="etat-vide"]')).not.toBeNull();
    expect(dernierToast()?.type).toBe('succes');
  });

  it('shows the reason sent by the back when the deletion fails', () => {
    ouvrirLaPage([enit]);

    cliquer('button.supprimer');
    cliquer('[data-test="confirmer"]');
    httpMock.expectOne(`${api}/delete/7`).flush(
      { title: 'Not Found', status: 404, detail: 'Universite introuvable : 7' },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    expect(dernierToast()).toEqual(jasmine.objectContaining({ type: 'erreur', message: 'Universite introuvable : 7' }));
    expect(lignes().length).toBe(1);
  });

  it('assigns a free foyer to a universite (foyers already used are not offered)', () => {
    ouvrirLaPage([fst, enit]);

    cliquer('tr.ligne:nth-child(2) button.affecter');
    httpMock.expectOne('/tpFoyer17/api/foyers/getAll').flush([
      { idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 300 },   // already used by FST
      { idFoyer: 9, nomFoyer: 'Foyer Ennour', capaciteFoyer: 120 }
    ]);
    fixture.detectChanges();

    const select = page.querySelector<HTMLSelectElement>('select[name="idFoyer"]')!;
    const options = Array.from(select.options).map(o => o.textContent?.trim());
    expect(options).toEqual(['Choisir un foyer…', 'Foyer Ennour (120 places)']);

    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    cliquer('[data-test="confirmer-affectation"]');

    const put = httpMock.expectOne(r => r.url === `${api}/affecter-foyer-universite`);
    expect(put.request.params.get('idFoyer')).toBe('9');
    expect(put.request.params.get('nomUniversite')).toBe('ENIT');
    put.flush({ ...enit, foyer: { idFoyer: 9, nomFoyer: 'Foyer Ennour', capaciteFoyer: 120 } });
    fixture.detectChanges();

    expect(lignes()[1].textContent).toContain('Foyer Ennour');
    expect(dernierToast()?.type).toBe('succes');
  });

  it('unassigns the foyer of a universite after confirmation', () => {
    ouvrirLaPage([fst]);

    cliquer('button.desaffecter');
    cliquer('[data-test="confirmer"]');

    const put = httpMock.expectOne(`${api}/desaffecter-foyer-universite?idUniversite=1`);
    expect(put.request.method).toBe('PUT');
    put.flush({ ...fst, foyer: null });
    fixture.detectChanges();

    expect(lignes()[0].textContent).toContain('Non affecté');
    expect(lignes()[0].querySelector('button.affecter')).not.toBeNull();
  });

  it('filters the table with the search field', () => {
    ouvrirLaPage([fst, enit]);

    saisir('recherche', 'enit');

    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('ENIT');
  });
});
