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

  it('should render the brand and the links to the pages already built', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const liens = Array.from(compiled.querySelectorAll('a.nav-lien')).map(a => a.getAttribute('href'));

    expect(compiled.querySelector('.marque')?.textContent).toContain('tpFoyer');
    expect(liens).toEqual(['/universites', '/foyers', '/blocs', '/chambres', '/etudiants']);
  });

  it('should show the pages not built yet as disabled', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const desactives = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-lien.desactive');

    expect(desactives.length).toBe(2);
    expect(desactives[0].textContent).toContain('bientôt');
  });
});
