import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the brand and one link per page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.brand')?.textContent).toContain('tpFoyer');
    const links = Array.from(element.querySelectorAll('nav a')).map((link) => link.textContent?.trim());
    expect(links).toEqual(['Accueil', 'Universités', 'Foyers', 'Blocs', 'Chambres', 'Étudiants', 'Réservations']);
  });
});
