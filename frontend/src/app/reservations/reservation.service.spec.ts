import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReservationService } from './reservation.service';

/** Unit test of the service alone: the HTTP API is replaced by HttpTestingController */
describe('ReservationService', () => {
  const api = '/tpFoyer17/api/reservations';
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll', () => {
    service.getAll().subscribe();

    expect(httpMock.expectOne(`${api}/getAll`).request.method).toBe('GET');
  });

  it('reserver() sends the bloc id in the parameter the back names "idChambre"', () => {
    service.reserver(3, 1234567).subscribe();

    const req = httpMock.expectOne(r => r.url === `${api}/ajouter-reservation`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.params.get('idChambre')).toBe('3');
    expect(req.request.params.get('cinEtudiant')).toBe('1234567');
  });

  it('annuler() sends a PUT to /annuler-reservation with the CIN', () => {
    service.annuler(1234567).subscribe();

    const req = httpMock.expectOne(`${api}/annuler-reservation?cinEtudiant=1234567`);
    expect(req.request.method).toBe('PUT');
  });
});
