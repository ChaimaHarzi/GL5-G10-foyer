import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BlocService } from './bloc.service';
import { ChambreService } from './chambre.service';
import { EtudiantService } from './etudiant.service';
import { FoyerService } from './foyer.service';
import { ReservationService } from './reservation.service';
import { UniversiteService } from './universite.service';

/** The services only build HTTP requests: the fake backend checks their method, URL, body and parameters. */
describe('API services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('CrudService: getAll, add, update and delete use the path of the resource', () => {
    const service = TestBed.inject(FoyerService);

    service.getAll().subscribe();
    http.expectOne({ method: 'GET', url: '/tpFoyer17/api/foyers/getAll' }).flush([]);

    service.add({ nomFoyer: 'F1', capaciteFoyer: 100 }).subscribe();
    const add = http.expectOne({ method: 'POST', url: '/tpFoyer17/api/foyers/add' });
    expect(add.request.body).toEqual({ nomFoyer: 'F1', capaciteFoyer: 100 });
    add.flush({});

    service.update({ idFoyer: 3, nomFoyer: 'F2' }).subscribe();
    const update = http.expectOne({ method: 'PUT', url: '/tpFoyer17/api/foyers/update' });
    expect(update.request.body).toEqual({ idFoyer: 3, nomFoyer: 'F2' });
    update.flush({});

    service.delete(3).subscribe();
    http.expectOne({ method: 'DELETE', url: '/tpFoyer17/api/foyers/delete/3' }).flush(null);
  });

  it('each resource has its own path', () => {
    TestBed.inject(BlocService).getAll().subscribe();
    TestBed.inject(ChambreService).getAll().subscribe();
    TestBed.inject(EtudiantService).getAll().subscribe();

    http.expectOne('/tpFoyer17/api/blocs/getAll').flush([]);
    http.expectOne('/tpFoyer17/api/chambres/getAll').flush([]);
    http.expectOne('/tpFoyer17/api/etudiants/getAll').flush([]);
  });

  it('UniversiteService sends the foyer and the university as query parameters', () => {
    const service = TestBed.inject(UniversiteService);

    service.affecterFoyer(2, 'ESPRIT').subscribe();
    const affecter = http.expectOne((r) => r.url === '/tpFoyer17/api/universites/affecter-foyer-universite');
    expect(affecter.request.method).toBe('PUT');
    expect(affecter.request.params.get('idFoyer')).toBe('2');
    expect(affecter.request.params.get('nomUniversite')).toBe('ESPRIT');
    affecter.flush({});

    service.desaffecterFoyer(5).subscribe();
    const desaffecter = http.expectOne((r) => r.url === '/tpFoyer17/api/universites/desaffecter-foyer-universite');
    expect(desaffecter.request.params.get('idUniversite')).toBe('5');
    desaffecter.flush({});
  });

  it('BlocService sends the room ids in the body and the bloc as a parameter', () => {
    TestBed.inject(BlocService).affecterChambres(1, [5, 6]).subscribe();

    const request = http.expectOne((r) => r.url === '/tpFoyer17/api/blocs/affecter-chambre-bloc');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual([5, 6]);
    expect(request.request.params.get('idBloc')).toBe('1');
    request.flush({});
  });

  it('ReservationService books, cancels, lists and deletes', () => {
    const service = TestBed.inject(ReservationService);

    service.ajouter(3, 111).subscribe();
    const ajouter = http.expectOne((r) => r.url === '/tpFoyer17/api/reservations/ajouter-reservation');
    expect(ajouter.request.method).toBe('PUT');
    expect(ajouter.request.params.get('idBloc')).toBe('3');
    expect(ajouter.request.params.get('cinEtudiant')).toBe('111');
    ajouter.flush({});

    service.annuler(111).subscribe();
    const annuler = http.expectOne((r) => r.url === '/tpFoyer17/api/reservations/annuler-reservation');
    expect(annuler.request.params.get('cinEtudiant')).toBe('111');
    annuler.flush({});

    service.getAll().subscribe();
    http.expectOne({ method: 'GET', url: '/tpFoyer17/api/reservations/getAll' }).flush([]);

    service.delete('5A2026').subscribe();
    http.expectOne({ method: 'DELETE', url: '/tpFoyer17/api/reservations/delete/5A2026' }).flush(null);
  });
});
