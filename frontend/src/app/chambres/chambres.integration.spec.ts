import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../shared/toast/toast.service';
import { Chambres } from './chambres';

/**
 * Integration test of the page: real component + template + ChambreService, BlocService.
 * Only the HTTP API is simulated. The bloc of each chambre is hidden by @JsonIgnore and rebuilt from the blocs.
 */
describe('Chambres page (integration)', () => {
  const api = '/tpFoyer17/api';
  const c101 = { idChambre: 11, numeroChambre: 101, typeChambre: 'DOUBLE' };
  const c102 = { idChambre: 12, numeroChambre: 102, typeChambre: 'SIMPLE' };
  const c201 = { idChambre: 21, numeroChambre: 201, typeChambre: 'TRIPLE' };
  const blocA = { idBloc: 3, nomBloc: 'Bloc A', capaciteBloc: 60, foyer: null, chambres: [c101, c102] };

  let fixture: ComponentFixture<Chambres>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chambres],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Chambres);
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    page = fixture.nativeElement;
  });

  afterEach(() => httpMock.verify());

  function ouvrirLaPage(chambres: unknown[], blocs: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(`${api}/chambres/getAll`).flush(chambres);
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
  const texte = (ligne: Element, test: string) => ligne.querySelector(`[data-test="${test}"]`)?.textContent?.trim();
  const valeursStats = () => Array.from(page.querySelectorAll('[data-test="valeur"]')).map(e => e.textContent?.trim());

  it('shows each chambre sorted by number, with its type and its bloc rebuilt from the blocs', () => {
    ouvrirLaPage([c201, c102, c101], [blocA]);

    expect(lignes().length).toBe(3);
    expect(lignes()[0].textContent).toContain('Chambre 101');
    expect(texte(lignes()[0], 'type')).toBe('Double');
    expect(texte(lignes()[0], 'bloc')).toBe('Bloc A');
    expect(texte(lignes()[2], 'bloc')).toBe('Sans bloc');
    expect(valeursStats()).toEqual(['3', '1 / 1 / 1', '1']);
  });

  it('filters the chambres by type', () => {
    ouvrirLaPage([c101, c102, c201], [blocA]);

    cliquer('button[data-type="TRIPLE"]');
    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Chambre 201');

    cliquer('button[data-type="TOUS"]');
    expect(lignes().length).toBe(3);
  });

  it('adds a chambre in a bloc: POST /add, then PUT /affecter-chambre-bloc with the new id', () => {
    ouvrirLaPage([c101], [{ ...blocA, chambres: [c101] }]);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('numeroChambre', '301');
    choisir('typeChambre', 2);
    choisir('idBloc', 1);
    cliquer('form button[type="submit"]');

    const post = httpMock.expectOne(`${api}/chambres/add`);
    expect(post.request.body).toEqual({ numeroChambre: 301, typeChambre: 'TRIPLE' });
    post.flush({ idChambre: 31, numeroChambre: 301, typeChambre: 'TRIPLE' });

    const put = httpMock.expectOne(`${api}/blocs/affecter-chambre-bloc?idBloc=3`);
    expect(put.request.body).toEqual([31]);
    put.flush(blocA);
    fixture.detectChanges();

    expect(lignes().length).toBe(2);
    expect(texte(lignes()[1], 'bloc')).toBe('Bloc A');
    expect(page.querySelector('[role="dialog"]')).toBeNull();
    expect(toasts.toasts().at(-1)?.message).toBe('La chambre 301 a été ajoutée.');
  });

  it('refuses a number that already exists without calling the API', () => {
    ouvrirLaPage([c101], []);

    cliquer('[data-test="ouvrir-ajout"]');
    saisir('numeroChambre', '101');
    cliquer('form button[type="submit"]');

    httpMock.expectNone(`${api}/chambres/add`);
    expect(page.querySelector('.erreur-champ')?.textContent).toContain('existe déjà');
  });

  it('edits a chambre with PUT /update, keeping its bloc', () => {
    ouvrirLaPage([c101], [blocA]);

    cliquer('button.modifier');
    expect(page.querySelector('select[name="idBloc"]')).toBeNull();   // the bloc is changed on the Blocs page
    choisir('typeChambre', 0);
    cliquer('form button[type="submit"]');

    const put = httpMock.expectOne(`${api}/chambres/update`);
    expect(put.request.body).toEqual({ idChambre: 11, numeroChambre: 101, typeChambre: 'SIMPLE' });
    put.flush({ ...c101, typeChambre: 'SIMPLE' });
    fixture.detectChanges();

    expect(texte(lignes()[0], 'type')).toBe('Simple');
    expect(texte(lignes()[0], 'bloc')).toBe('Bloc A');
  });

  it('deletes a chambre after confirmation', () => {
    ouvrirLaPage([c101, c201], [blocA]);

    cliquer('button.supprimer');
    expect(page.querySelector('[role="dialog"]')?.textContent).toContain('La chambre 101');

    cliquer('[data-test="confirmer"]');
    httpMock.expectOne(`${api}/chambres/delete/11`).flush(null);
    fixture.detectChanges();

    expect(lignes().length).toBe(1);
    expect(lignes()[0].textContent).toContain('Chambre 201');
    expect(toasts.toasts().at(-1)?.type).toBe('succes');
  });
});
