import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../shared/toast/toast.service';
import { Blocs } from './blocs';

/**
 * Integration test of the page: real component + template + BlocService, FoyerService, ChambreService.
 * Only the HTTP API is simulated.
 */
describe('Blocs page (integration)', () => {
  const api = '/tpFoyer17/api';
  const elAmal = { idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 300 };
  const c101 = { idChambre: 11, numeroChambre: 101, typeChambre: 'DOUBLE' };
  const c102 = { idChambre: 12, numeroChambre: 102, typeChambre: 'SIMPLE' };
  const c201 = { idChambre: 21, numeroChambre: 201, typeChambre: 'TRIPLE' };
  const blocA = { idBloc: 3, nomBloc: 'Bloc A', capaciteBloc: 60, foyer: elAmal, chambres: [c101] };
  const blocB = { idBloc: 5, nomBloc: 'Bloc B', capaciteBloc: 40, foyer: null, chambres: [] };

  let fixture: ComponentFixture<Blocs>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blocs],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Blocs);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(blocs: unknown[], foyers: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/blocs/getAll`).flush(blocs);
    httpMock.expectOne(`${api}/foyers/getAll`).flush(foyers);
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

  it('shows each bloc with its foyer and its number of chambres', () => {
    ouvrirLaPage([blocA, blocB], [elAmal]);

    expect(lignes().length).toBe(2);
    expect(lignes()[0].textContent).toContain('Foyer El Amal');
    expect(lignes()[0].querySelector('[data-test="nb-chambres"]')?.textContent).toContain('1 chambre(s)');
    expect(lignes()[1].textContent).toContain('Sans foyer');
  });

  it('adds a bloc in a foyer: the id of the foyer is sent and its name is shown', () => {
    ouvrirLaPage([], [elAmal]);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('nomBloc', 'Bloc C');
    saisir('capaciteBloc', '50');
    const select = page.querySelector<HTMLSelectElement>('select[name="idFoyer"]')!;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/blocs/add`);
    expect(post.request.body).toEqual({ nomBloc: 'Bloc C', capaciteBloc: 50, idFoyer: 4 });
    // The back answers with a foyer that only has its id
    post.flush({ idBloc: 8, nomBloc: 'Bloc C', capaciteBloc: 50, foyer: { idFoyer: 4, nomFoyer: null, capaciteFoyer: 0 }, chambres: null });
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Foyer El Amal');
    expect(lignes()[0].textContent).toContain('0 chambre(s)');
  });

  it('edits a bloc with PUT /update, keeping its chambres', () => {
    ouvrirLaPage([blocA], [elAmal]);

    cliquer('button.modifier');
    saisir('nomBloc', 'Bloc A1');
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/blocs/update`);
    expect(put.request.body).toEqual({ idBloc: 3, nomBloc: 'Bloc A1', capaciteBloc: 60, idFoyer: 4 });
    put.flush({ ...blocA, nomBloc: 'Bloc A1', chambres: null });
    fixture.detectChanges();

    expect(lignes()[0].textContent).toContain('Bloc A1');
    expect(lignes()[0].textContent).toContain('1 chambre(s)');
  });

  it('does not allow deleting a bloc that contains chambres, but deletes an empty one', () => {
    ouvrirLaPage([blocA, blocB], []);

    const boutons = page.querySelectorAll<HTMLButtonElement>('button.supprimer');
    expect(boutons[0].disabled).toBeTrue();

    boutons[1].click();
    fixture.detectChanges();
    cliquer('[data-test="confirmer"]');
    httpMock.expectOne(`${api}/blocs/delete/5`).flush(null);
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
  });

  it('assigns chambres to a bloc, then reloads the blocs to show the new counts', () => {
    ouvrirLaPage([blocA, blocB], [elAmal]);

    cliquer('tr.ligne:nth-child(2) button.affecter');
    httpMock.expectOne(`${api}/chambres/getAll`).flush([c201, c102, c101]);
    fixture.detectChanges();

    const cases = Array.from(page.querySelectorAll('label.case')).map(c => c.textContent?.replace(/\s+/g, ' ').trim());
    expect(cases[0]).toContain('Chambre 101');
    expect(cases[0]).toContain('dans Bloc A');
    expect(cases[1]).toContain('sans bloc');

    const confirmer = page.querySelector<HTMLButtonElement>('[data-test="confirmer-affectation"]')!;
    expect(confirmer.disabled).toBeTrue();   // nothing selected yet

    cliquer('input[data-chambre="12"]');
    cliquer('input[data-chambre="21"]');
    cliquer('[data-test="confirmer-affectation"]');

    const put = httpMock.expectOne(`${api}/blocs/affecter-chambre-bloc?idBloc=5`);
    expect(put.request.body).toEqual([12, 21]);
    put.flush(blocB);

    httpMock.expectOne(`${api}/blocs/getAll`).flush([blocA, { ...blocB, chambres: [c102, c201] }]);
    fixture.detectChanges();

    expect(page.querySelector('[role="dialog"]')).toBeNull();
    expect(lignes()[1].textContent).toContain('2 chambre(s)');
    expect(toasts.toasts().at(-1)?.message).toContain('2 chambre(s) affectée(s)');
  });
});
