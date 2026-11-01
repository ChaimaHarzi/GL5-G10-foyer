import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BlocService } from './bloc.service';

/** Unit test of the service alone: the HTTP API is replaced by HttpTestingController */
describe('BlocService', () => {
  const api = '/tpFoyer17/api/blocs';
  let service: BlocService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BlocService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() sends a GET to /getAll', () => {
    service.getAll().subscribe();

    expect(httpMock.expectOne(`${api}/getAll`).request.method).toBe('GET');
  });

  it('add() sends a POST to /add with the foyer given by its id (BlocDTO)', () => {
    service.add({ nomBloc: 'Bloc A', capaciteBloc: 60, idFoyer: 4 }).subscribe();

    const req = httpMock.expectOne(`${api}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nomBloc: 'Bloc A', capaciteBloc: 60, idFoyer: 4 });
  });

  it('update() sends a PUT to /update with the bloc id in the body', () => {
    service.update(3, { nomBloc: 'Bloc A2', capaciteBloc: 70, idFoyer: null }).subscribe();

    const req = httpMock.expectOne(`${api}/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idBloc: 3, nomBloc: 'Bloc A2', capaciteBloc: 70, idFoyer: null });
  });

  it('affecterChambres() sends a PUT with the chambre ids in the body and the bloc id as parameter', () => {
    service.affecterChambres(3, [11, 12]).subscribe();

    const req = httpMock.expectOne(`${api}/affecter-chambre-bloc?idBloc=3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual([11, 12]);
  });

  it('delete() sends a DELETE to /delete/{id}', () => {
    service.delete(3).subscribe();

    expect(httpMock.expectOne(`${api}/delete/3`).request.method).toBe('DELETE');
  });
});
