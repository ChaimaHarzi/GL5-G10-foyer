import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BlocService } from '../core/bloc.service';
import { ChambreService } from '../core/chambre.service';
import { FoyerService } from '../core/foyer.service';
import { UniversiteService } from '../core/universite.service';
import { BlocsPage } from './blocs/blocs-page';
import { ChambresPage } from './chambres/chambres-page';
import { EtudiantsPage } from './etudiants/etudiants-page';
import { FoyersPage } from './foyers/foyers-page';
import { UniversitesPage } from './universites/universites-page';
import { EtudiantService } from '../core/etudiant.service';

const foyer = { idFoyer: 2, nomFoyer: 'Foyer Nord', capaciteFoyer: 300 };
const chambres = [
  { idChambre: 5, numeroChambre: 101, typeChambre: 'SIMPLE' },
  { idChambre: 6, numeroChambre: 102, typeChambre: 'DOUBLE' },
];

function select(element: HTMLElement, name: string, indexes: number[]) {
  const list = element.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
  Array.from(list.options).forEach((option, i) => (option.selected = indexes.includes(i)));
  list.dispatchEvent(new Event('change'));
}

describe('Pages', () => {
  it('Universités: assigns the chosen foyer to the chosen university', async () => {
    const service = {
      getAll: vi.fn(() => of([{ idUniversite: 1, nomUniversite: 'ESPRIT', adresse: 'Ariana', foyer: null }])),
      affecterFoyer: vi.fn(() => of({})),
      desaffecterFoyer: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [UniversitesPage],
      providers: [
        { provide: UniversiteService, useValue: service },
        { provide: FoyerService, useValue: { getAll: () => of([foyer]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(UniversitesPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    select(element, 'nomUniversite', [0]);
    select(element, 'idFoyer', [0]);
    await fixture.whenStable();
    element.querySelectorAll<HTMLButtonElement>('button[type="submit"]')[1].click();
    await fixture.whenStable();

    expect(service.affecterFoyer).toHaveBeenCalledWith(2, 'ESPRIT');
    expect(element.textContent).toContain('Ariana');
  });

  it('Blocs: puts the chosen rooms in the chosen bloc', async () => {
    const service = {
      getAll: vi.fn(() => of([{ idBloc: 1, nomBloc: 'A', capaciteBloc: 10, foyer, chambres: [] }])),
      affecterChambres: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [BlocsPage],
      providers: [
        { provide: BlocService, useValue: service },
        { provide: ChambreService, useValue: { getAll: () => of(chambres) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlocsPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    select(element, 'idBloc', [0]);
    select(element, 'idsChambres', [0, 1]);
    await fixture.whenStable();
    element.querySelectorAll<HTMLButtonElement>('button[type="submit"]')[1].click();
    await fixture.whenStable();

    expect(service.affecterChambres).toHaveBeenCalledWith(1, [5, 6]);
    expect(element.textContent).toContain('Foyer Nord');
  });

  it('Foyers, Chambres and Étudiants show their own columns', async () => {
    await TestBed.configureTestingModule({
      imports: [FoyersPage, ChambresPage, EtudiantsPage],
      providers: [
        { provide: FoyerService, useValue: { getAll: () => of([foyer]) } },
        { provide: ChambreService, useValue: { getAll: () => of(chambres) } },
        {
          provide: EtudiantService,
          useValue: {
            getAll: () =>
              of([{ idEtudiant: 1, nomEtudiant: 'Ben Salah', prenomEtudiant: 'Ali', cinEtudiant: 111, dateNaissance: '2003-05-14T00:00:00.000+00:00' }]),
          },
        },
      ],
    }).compileComponents();

    const foyers = TestBed.createComponent(FoyersPage);
    const chambresPage = TestBed.createComponent(ChambresPage);
    const etudiants = TestBed.createComponent(EtudiantsPage);
    await Promise.all([foyers.whenStable(), chambresPage.whenStable(), etudiants.whenStable()]);

    expect(foyers.nativeElement.textContent).toContain('Foyer Nord');
    expect(chambresPage.nativeElement.textContent).toContain('DOUBLE');
    expect(etudiants.nativeElement.textContent).toContain('2003-05-14');
  });
});
