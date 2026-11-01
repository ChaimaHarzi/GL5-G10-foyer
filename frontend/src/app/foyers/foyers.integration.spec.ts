import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../shared/toast/toast.service';
import { Foyers } from './foyers';

/**
 * Integration test of the page: real component + template + FoyerService, UniversiteService, BlocService.
 * Only the HTTP API is simulated. The page loads 3 lists and rebuilds the links hidden by @JsonIgnore.
 */
describe('Foyers page (integration)', () => {
  const api = '/tpFoyer17/api';
  const elAmal = { idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 300 };
  const ennour = { idFoyer: 9, nomFoyer: 'Foyer Ennour', capaciteFoyer: 120 };
  const fst = { idUniversite: 1, nomUniversite: 'FST', adresse: 'El Manar', foyer: elAmal };
  const enit = { idUniversite: 2, nomUniversite: 'ENIT', adresse: 'Tunis', foyer: null };
  const blocA = { idBloc: 3, nomBloc: 'Bloc A', capaciteBloc: 60, foyer: elAmal, chambres: [] };
  const blocB = { idBloc: 5, nomBloc: 'Bloc B', capaciteBloc: 40, foyer: elAmal, chambres: [] };

  let fixture: ComponentFixture<Foyers>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Foyers],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Foyers);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(foyers: unknown[], universites: unknown[], blocs: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/foyers/getAll`).flush(foyers);
    httpMock.expectOne(`${api}/universites/getAll`).flush(universites);
    httpMock.expectOne(`${api}/blocs/getAll`).flush(blocs);
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

  function choisir(name: string, index: number): void {
    const select = page.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  const lignes = () => page.querySelectorAll('tr.ligne');
  const valeursStats = () => Array.from(page.querySelectorAll('[data-test="valeur"]')).map(e => e.textContent?.trim());

  it('shows each foyer with its universite and its number of blocs, rebuilt from the other lists', () => {
    ouvrirLaPage([elAmal, ennour], [fst, enit], [blocA, blocB]);

    expect(lignes().length).toBe(2);
    expect(lignes()[0].textContent).toContain('FST');
    expect(lignes()[0].querySelector('[data-test="nb-blocs"]')?.textContent).toContain('2 bloc(s)');
    expect(lignes()[1].textContent).toContain('Non affecté');
    expect(valeursStats()).toEqual(['2', '420', '1']);
  });

  it('adds a foyer without universite with POST /add', () => {
    ouvrirLaPage([], [enit], []);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('nomFoyer', 'Foyer Ennour');
    saisir('capaciteFoyer', '120');
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/foyers/add`);
    expect(post.request.body).toEqual({ nomFoyer: 'Foyer Ennour', capaciteFoyer: 120 });
    post.flush(ennour);
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Non affecté');
  });

  it('adds a foyer and assigns it to a universite with POST /ajouter-affecter', () => {
    ouvrirLaPage([elAmal], [fst, enit], []);

    cliquer('[data-test="ouvrir-ajout"]');
    const options = Array.from(page.querySelectorAll<HTMLOptionElement>('select[name="idUniversite"] option')).map(o => o.textContent?.trim());
    expect(options).toEqual(['Aucune pour le moment', 'ENIT']);   // FST already has a foyer

    saisir('nomFoyer', 'Foyer Ennour');
    saisir('capaciteFoyer', '120');
    choisir('idUniversite', 1);
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/foyers/ajouter-affecter?idUniversite=2`);
    expect(post.request.body).toEqual({ nomFoyer: 'Foyer Ennour', capaciteFoyer: 120 });
    post.flush(ennour);
    fixture.detectChanges();

    expect(lignes()[1].textContent).toContain('ENIT');
    expect(valeursStats()[2]).toBe('2');
  });

  it('refuses a capacity lower than 1 without calling the API', () => {
    ouvrirLaPage([], [], []);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('nomFoyer', 'Foyer Ennour');
    saisir('capaciteFoyer', '0');
    cliquer('form button[type="submit"]');

    httpMock.expectNone(`${api}/foyers/add`);
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('au moins 1');
  });

  it('edits a foyer with PUT /update', () => {
    ouvrirLaPage([elAmal], [fst], []);

    cliquer('button.modifier');
    expect(page.querySelector('select[name="idUniversite"]')).toBeNull();   // the universite is not changed here
    saisir('capaciteFoyer', '350');
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/foyers/update`);
    expect(put.request.body).toEqual({ idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 350 });
    put.flush({ ...elAmal, capaciteFoyer: 350 });
    fixture.detectChanges();

    expect(lignes()[0].textContent).toContain('350');
  });

  it('does not allow deleting a foyer still assigned to a universite', () => {
    ouvrirLaPage([elAmal], [fst], []);

    expect(page.querySelector<HTMLButtonElement>('button.supprimer')!.disabled).toBeTrue();
  });

  it('deletes a free foyer after confirmation, warning that its blocs go with it', () => {
    ouvrirLaPage([ennour], [], [{ ...blocA, foyer: ennour }]);

    cliquer('button.supprimer');
    expect(page.querySelector('[role="dialog"]')?.textContent).toContain('1 bloc(s) seront aussi supprimés');

    cliquer('[data-test="confirmer"]');
    httpMock.expectOne(`${api}/foyers/delete/9`).flush(null);
    fixture.detectChanges();

    expect(lignes().length).toBe(0);
    expect(toasts.toasts().at(-1)?.type).toBe('succes');
  });
});
