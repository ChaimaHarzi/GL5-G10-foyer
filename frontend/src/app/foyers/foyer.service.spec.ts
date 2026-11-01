import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FoyerService } from './foyer.service';

/** Unit test of the service alone: the HTTP API is replaced by HttpTestingController */
describe('FoyerService', () => {
  const api = '/tpFoyer17/api/foyers';
  let service: FoyerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FoyerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll', () => {
    service.getAll().subscribe();

    expect(httpMock.expectOne(`${api}/getAll`).request.method).toBe('GET');
  });

  it('add() sends a POST to /add with the name and the capacity', () => {
    service.add({ nomFoyer: 'El Amal', capaciteFoyer: 300 }).subscribe();

    const req = httpMock.expectOne(`${api}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nomFoyer: 'El Amal', capaciteFoyer: 300 });
  });

  it('ajouterEtAffecter() sends a POST to /ajouter-affecter with the universite id as parameter', () => {
    service.ajouterEtAffecter({ nomFoyer: 'El Amal', capaciteFoyer: 300 }, 2).subscribe();

    const req = httpMock.expectOne(`${api}/ajouter-affecter?idUniversite=2`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nomFoyer: 'El Amal', capaciteFoyer: 300 });
  });

  it('update() sends a PUT to /update with the id', () => {
    service.update({ idFoyer: 4, nomFoyer: 'El Amal 2', capaciteFoyer: 320 }).subscribe();

    const req = httpMock.expectOne(`${api}/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idFoyer: 4, nomFoyer: 'El Amal 2', capaciteFoyer: 320 });
  });

  it('delete() sends a DELETE to /delete/{id}', () => {
    service.delete(4).subscribe();

    expect(httpMock.expectOne(`${api}/delete/4`).request.method).toBe('DELETE');
  });
});
