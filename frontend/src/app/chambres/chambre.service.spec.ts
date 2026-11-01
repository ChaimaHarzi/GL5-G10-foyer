import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ChambreService } from './chambre.service';

/** Unit test of the service alone: the HTTP API is replaced by HttpTestingController */
describe('ChambreService', () => {
  const api = '/tpFoyer17/api/chambres';
  let service: ChambreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ChambreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll', () => {
    service.getAll().subscribe();

    expect(httpMock.expectOne(`${api}/getAll`).request.method).toBe('GET');
  });

  it('add() sends a POST to /add with the number and the type (ChambreDTO)', () => {
    service.add({ numeroChambre: 101, typeChambre: 'DOUBLE' }).subscribe();

    const req = httpMock.expectOne(`${api}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ numeroChambre: 101, typeChambre: 'DOUBLE' });
  });

  it('update() sends a PUT to /update with the chambre id in the body', () => {
    service.update(11, { numeroChambre: 102, typeChambre: 'TRIPLE' }).subscribe();

    const req = httpMock.expectOne(`${api}/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idChambre: 11, numeroChambre: 102, typeChambre: 'TRIPLE' });
  });

  it('delete() sends a DELETE to /delete/{id}', () => {
    service.delete(11).subscribe();

    expect(httpMock.expectOne(`${api}/delete/11`).request.method).toBe('DELETE');
  });

  it('returns the chambres sent by the back', () => {
    let recu: unknown;
    service.getAll().subscribe(chambres => (recu = chambres));

    httpMock.expectOne(`${api}/getAll`).flush([{ idChambre: 11, numeroChambre: 101, typeChambre: 'SIMPLE' }]);
    expect(recu).toEqual([{ idChambre: 11, numeroChambre: 101, typeChambre: 'SIMPLE' }]);
  });
});
