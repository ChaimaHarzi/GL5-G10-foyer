import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EtudiantService } from './etudiant.service';

/** Unit test of the service alone: the HTTP API is replaced by HttpTestingController */
describe('EtudiantService', () => {
  const api = '/tpFoyer17/api/etudiants';
  const amine = { nomEtudiant: 'Ben Salah', prenomEtudiant: 'Amine', cinEtudiant: 1234567, dateNaissance: '2004-03-15' };
  let service: EtudiantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EtudiantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll', () => {
    service.getAll().subscribe();

    expect(httpMock.expectOne(`${api}/getAll`).request.method).toBe('GET');
  });

  it('add() sends a POST to /add with the fields of EtudiantDTO', () => {
    service.add(amine).subscribe();

    const req = httpMock.expectOne(`${api}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(amine);
  });

  it('update() sends a PUT to /update with the etudiant id in the body', () => {
    service.update(5, amine).subscribe();

    const req = httpMock.expectOne(`${api}/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idEtudiant: 5, ...amine });
  });

  it('delete() sends a DELETE to /delete/{id}', () => {
    service.delete(5).subscribe();

    expect(httpMock.expectOne(`${api}/delete/5`).request.method).toBe('DELETE');
  });
});
