import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BlocService } from '../../core/bloc.service';
import { ChambreService } from '../../core/chambre.service';
import { EtudiantService } from '../../core/etudiant.service';
import { FoyerService } from '../../core/foyer.service';
import { ReservationService } from '../../core/reservation.service';
import { UniversiteService } from '../../core/universite.service';
import { AccueilPage } from './accueil-page';

const list = (size: number) => ({ getAll: () => of(new Array(size).fill({})) });

describe('AccueilPage', () => {
  it('shows how many elements each resource has, and a dash when the API fails', async () => {
    await TestBed.configureTestingModule({
      imports: [AccueilPage],
      providers: [
        provideRouter([]),
        { provide: UniversiteService, useValue: list(2) },
        { provide: FoyerService, useValue: list(1) },
        { provide: BlocService, useValue: list(3) },
        { provide: ChambreService, useValue: list(12) },
        { provide: EtudiantService, useValue: list(5) },
        { provide: ReservationService, useValue: { getAll: () => throwError(() => new HttpErrorResponse({ status: 500 })) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccueilPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const values = Array.from(element.querySelectorAll('.stat-value')).map((value) => value.textContent?.trim());
    expect(values).toEqual(['2', '1', '3', '12', '5', '–']);
    expect(element.querySelector('a[href="/tpFoyer17/swagger-ui/index.html"]')).not.toBeNull();
  });
});
