import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { FoyerService } from '../foyers/foyer.service';
import { Universite } from './universite.model';
import { Universites } from './universites';
import { UniversiteService } from './universite.service';

/**
 * Unit test of the component alone: UniversiteService is replaced by a Jasmine spy,
 * so no HTTP at all. Checks what the page shows for each answer of the service.
 */
describe('Universites (unit)', () => {
  let fixture: ComponentFixture<Universites>;
  let service: jasmine.SpyObj<UniversiteService>;
  let page: HTMLElement;

  const fst: Universite = {
    idUniversite: 1, nomUniversite: 'Faculté des Sciences de Tunis', adresse: 'El Manar',
    foyer: { idFoyer: 4, nomFoyer: 'Foyer El Amal', capaciteFoyer: 300 }
  };
  const enit: Universite = { idUniversite: 2, nomUniversite: 'ENIT', adresse: 'Tunis', foyer: null };

  beforeEach(async () => {
    service = jasmine.createSpyObj<UniversiteService>('UniversiteService',
      ['getAll', 'add', 'update', 'delete', 'affecterFoyer', 'desaffecterFoyer']);

    await TestBed.configureTestingModule({
      imports: [Universites],
      providers: [
        { provide: UniversiteService, useValue: service },
        { provide: FoyerService, useValue: jasmine.createSpyObj<FoyerService>('FoyerService', ['getAll']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Universites);
    page = fixture.nativeElement;
  });

  const valeursStats = () => Array.from(page.querySelectorAll('[data-test="valeur"]')).map(e => e.textContent?.trim());

  it('shows skeleton rows while the list is loading', () => {
    service.getAll.and.returnValue(NEVER);

    fixture.detectChanges();

    expect(page.querySelectorAll('tr.chargement').length).toBe(4);
    expect(page.querySelectorAll('tr.ligne').length).toBe(0);
  });

  it('displays the universites and computes the statistics', () => {
    service.getAll.and.returnValue(of([fst, enit]));

    fixture.detectChanges();

    expect(page.querySelectorAll('tr.ligne').length).toBe(2);
    expect(valeursStats()).toEqual(['2', '1', '1']);
    expect(page.querySelector('.badge-succes')?.textContent).toContain('Foyer El Amal');
    expect(page.querySelector('.badge-neutre')?.textContent).toContain('Non affecté');
  });

  it('builds the avatar initials from the significant words of the name', () => {
    service.getAll.and.returnValue(of([fst, enit]));

    fixture.detectChanges();

    const avatars = Array.from(page.querySelectorAll('.avatar')).map(e => e.textContent?.trim());
    expect(avatars).toEqual(['FS', 'EN']);
  });

  it('offers "assign" for a universite without foyer and "unassign" for one with a foyer', () => {
    service.getAll.and.returnValue(of([fst, enit]));

    fixture.detectChanges();

    const [ligneFst, ligneEnit] = Array.from(page.querySelectorAll('tr.ligne'));
    expect(ligneFst.querySelector('button.desaffecter')).not.toBeNull();
    expect(ligneFst.querySelector('button.affecter')).toBeNull();
    expect(ligneEnit.querySelector('button.affecter')).not.toBeNull();
  });

  it('shows the empty state when there is no universite', () => {
    service.getAll.and.returnValue(of([]));

    fixture.detectChanges();

    expect(page.querySelector('[data-test="etat-vide"]')).not.toBeNull();
  });

  it('shows the error state and loads again with the retry button', () => {
    service.getAll.and.returnValues(throwError(() => new Error('down')), of([enit]));

    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');

    page.querySelector<HTMLButtonElement>('[data-test="reessayer"]')!.click();
    fixture.detectChanges();

    expect(service.getAll).toHaveBeenCalledTimes(2);
    expect(page.querySelectorAll('tr.ligne').length).toBe(1);
  });
});
