import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand and a link to every page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const liens = Array.from(compiled.querySelectorAll('a.nav-lien')).map(a => a.getAttribute('href'));

    expect(compiled.querySelector('.marque')?.textContent).toContain('tpFoyer');
    expect(liens).toEqual(['/tableau-de-bord', '/universites', '/foyers', '/blocs', '/chambres', '/etudiants', '/reservations']);
  });

  it('should not show any page as "bientot" any more', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.nav-lien.desactive').length).toBe(0);
  });
});
