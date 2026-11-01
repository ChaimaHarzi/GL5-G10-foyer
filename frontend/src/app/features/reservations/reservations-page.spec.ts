import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BlocService } from '../../core/bloc.service';
import { EtudiantService } from '../../core/etudiant.service';
import { Reservation } from '../../core/models';
import { ReservationService } from '../../core/reservation.service';
import { ReservationsPage } from './reservations-page';

const etudiant = { idEtudiant: 1, nomEtudiant: 'Ben Salah', prenomEtudiant: 'Ali', cinEtudiant: 111, dateNaissance: null };
const reservation: Reservation = {
  idReservation: '5A2026',
  anneeUniversitaire: '2026-10-30T10:00:00.000+00:00',
  estValide: false,
  etudiants: [etudiant],
};

describe('ReservationsPage', () => {
  let fixture: ComponentFixture<ReservationsPage>;
  let element: HTMLElement;
  let service: {
    getAll: ReturnType<typeof vi.fn>;
    ajouter: ReturnType<typeof vi.fn>;
    annuler: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      getAll: vi.fn(() => of([reservation])),
      ajouter: vi.fn(() => of({ ...reservation, idReservation: '6A2026' })),
      annuler: vi.fn(() => of(reservation)),
      delete: vi.fn(() => of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [ReservationsPage],
      providers: [
        { provide: ReservationService, useValue: service },
        { provide: BlocService, useValue: { getAll: () => of([{ idBloc: 3, nomBloc: 'A', capaciteBloc: 10 }]) } },
        { provide: EtudiantService, useValue: { getAll: () => of([etudiant]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReservationsPage);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  /** Picks the first option, then waits for the page to update (the buttons are disabled until a choice is made). */
  async function choose(name: string) {
    const select = element.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
    select.selectedIndex = 0;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('lists the reservations with their year, state and students', () => {
    const row = element.querySelector('tbody tr')!;
    expect(row.textContent).toContain('5A2026');
    expect(row.textContent).toContain('2026');
    expect(row.textContent).toContain('Complète');
    expect(row.textContent).toContain('Ali Ben Salah (111)');
  });

  it('books a place for the chosen student in the chosen bloc', async () => {
    await choose('idBloc');
    await choose('cinEtudiant');
    element.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(service.ajouter).toHaveBeenCalledWith(3, 111);
    expect(element.querySelector('.success')?.textContent).toContain('Réservation 6A2026 enregistrée.');
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('cancels the reservation of the chosen student', async () => {
    await choose('annulation');
    const button = Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Annuler la réservation'),
    )!;
    button.click();
    await fixture.whenStable();

    expect(service.annuler).toHaveBeenCalledWith(111);
  });

  it('shows the message of the API when the booking is refused', async () => {
    service.ajouter.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Aucune chambre libre dans le bloc 3' } })),
    );
    await choose('idBloc');
    await choose('cinEtudiant');
    element.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(element.querySelector('.error')?.textContent).toContain('Aucune chambre libre dans le bloc 3');
  });
});
