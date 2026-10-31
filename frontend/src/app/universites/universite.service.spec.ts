import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Universite } from './universite.model';
import { UniversiteService } from './universite.service';

/**
 * Unit test of the service alone: the HTTP API is replaced by HttpTestingController,
 * which records the requests the service sends and lets the test choose the answers.
 */
describe('UniversiteService', () => {
  let service: UniversiteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UniversiteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Fails the test if the service sent a request that no test expected
  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll and returns the list', () => {
    const liste: Universite[] = [{ idUniversite: 1, nomUniversite: 'FST', adresse: 'Tunis' }];
    let resultat: Universite[] | undefined;

    service.getAll().subscribe(u => (resultat = u));

    const req = httpMock.expectOne('/tpFoyer17/api/universites/getAll');
    expect(req.request.method).toBe('GET');
    req.flush(liste);
    expect(resultat).toEqual(liste);
  });

  it('add() sends a POST to /add with the name and the address', () => {
    const nouvelle = { nomUniversite: 'FST', adresse: 'Tunis' };
    let resultat: Universite | undefined;

    service.add(nouvelle).subscribe(u => (resultat = u));

    const req = httpMock.expectOne('/tpFoyer17/api/universites/add');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nouvelle);
    req.flush({ idUniversite: 1, ...nouvelle });
    expect(resultat?.idUniversite).toBe(1);
  });

  it('update() sends a PUT to /update with the id, the name and the address', () => {
    const modifiee = { idUniversite: 3, nomUniversite: 'FST Tunis', adresse: 'El Manar' };
    let resultat: Universite | undefined;

    service.update(modifiee).subscribe(u => (resultat = u));

    const req = httpMock.expectOne('/tpFoyer17/api/universites/update');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(modifiee);
    req.flush({ ...modifiee, foyer: null });
    expect(resultat?.nomUniversite).toBe('FST Tunis');
  });

  it('delete() sends a DELETE to /delete/{id}', () => {
    service.delete(7).subscribe();

    const req = httpMock.expectOne('/tpFoyer17/api/universites/delete/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
